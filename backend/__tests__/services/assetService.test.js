/**
 * Unit tests for Asset Service
 */

// Mock mongoose models BEFORE importing anything else
jest.mock('../../models/asset');
jest.mock('../../models/auditLog');
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const assetService = require('../../services/assetService');
const Asset = require('../../models/asset');
const AuditLog = require('../../models/auditLog');
const mongoose = require('mongoose');

describe('AssetService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssets', () => {
    it('should return paginated assets with filters', async () => {
      const mockAssets = [
        { _id: '1', unique_asset_id: 'AST-001', manufacturer: 'Dell', model: 'Laptop' },
        { _id: '2', unique_asset_id: 'AST-002', manufacturer: 'HP', model: 'Desktop' },
      ];

      Asset.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAssets),
      });

      Asset.countDocuments = jest.fn().mockResolvedValue(2);

      const filters = { status: 'Active' };
      const pagination = { page: 1, limit: 10 };
      const user = { role: 'ADMIN' };

      const result = await assetService.getAssets(filters, pagination, user);

      expect(result.data).toEqual(mockAssets);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
      expect(Asset.find).toHaveBeenCalled();
    });

    it('should filter by department for non-admin users', async () => {
      Asset.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Asset.countDocuments = jest.fn().mockResolvedValue(0);

      const filters = {};
      const pagination = { page: 1, limit: 10 };
      const user = { role: 'INVENTORY_MANAGER', department: 'IT' };

      await assetService.getAssets(filters, pagination, user);

      // Verify that department filter was applied
      const findCall = Asset.find.mock.calls[0][0];
      expect(findCall.department).toBe('IT');
    });

    it('should throw error for invalid limit', async () => {
      const filters = {};
      const pagination = { page: 1, limit: 200 };
      const user = { role: 'ADMIN' };

      await expect(
        assetService.getAssets(filters, pagination, user)
      ).rejects.toThrow('Limit cannot exceed 100 items per page');
    });
  });

  describe('createAsset', () => {
    it('should create asset with transaction', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

      const assetData = {
        manufacturer: 'Dell',
        model: 'Laptop',
        serial_number: '12345',
        asset_type: 'IT Equipment',
        location: 'Office A',
        department: 'IT',
      };

      const mockAsset = {
        _id: 'asset123',
        unique_asset_id: 'AST-001',
        ...assetData,
        save: jest.fn().mockResolvedValue(true),
      };

      Asset.mockImplementation(() => mockAsset);

      AuditLog.create = jest.fn().mockResolvedValue([{ _id: 'log123' }]);

      const userId = 'user123';
      const result = await assetService.createAsset(assetData, userId);

      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockAsset.save).toHaveBeenCalledWith({ session: mockSession });
      expect(AuditLog.create).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toEqual(mockAsset);
    });

    it('should rollback transaction on error', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

      const mockAsset = {
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      Asset.mockImplementation(() => mockAsset);

      const assetData = { manufacturer: 'Dell' };
      const userId = 'user123';

      await expect(
        assetService.createAsset(assetData, userId)
      ).rejects.toThrow('Database error');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should auto-generate unique_asset_id if not provided', async () => {
      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };

      mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

      let savedAsset;
      Asset.mockImplementation((data) => {
        savedAsset = data;
        return {
          ...data,
          _id: 'asset123',
          save: jest.fn().mockResolvedValue(data),
        };
      });

      AuditLog.create = jest.fn().mockResolvedValue([{}]);

      const assetData = {
        manufacturer: 'Dell',
        model: 'Laptop',
        serial_number: '12345',
        asset_type: 'IT Equipment',
        location: 'Office A',
        department: 'IT',
      };

      await assetService.createAsset(assetData, 'user123');

      expect(savedAsset.unique_asset_id).toMatch(/^AST-\d{11}$/);
    });
  });
});
