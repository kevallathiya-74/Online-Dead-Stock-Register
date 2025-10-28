import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Documents from '../documents/Documents';

const AdminDocumentsPage: React.FC = () => (
  <DashboardLayout>
    <Documents embedded />
  </DashboardLayout>
);

export default AdminDocumentsPage;