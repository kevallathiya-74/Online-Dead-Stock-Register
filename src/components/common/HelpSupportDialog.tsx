import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  Computer as ComputerIcon,
  Assignment as AssignmentIcon,
  Build as MaintenanceIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  ContactSupport as ContactSupportIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

interface HelpSupportDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqData: FAQ[] = [
  {
    id: 'assets-view',
    category: 'Assets',
    question: 'How do I view my assigned assets?',
    answer: 'Navigate to "My Assets" from the sidebar menu. You will see a list of all assets currently assigned to you with details like asset name, category, location, and condition.',
    tags: ['assets', 'view', 'assigned']
  },
  {
    id: 'assets-request',
    category: 'Assets',
    question: 'Can I request a new asset?',
    answer: 'Yes! Go to "My Requests" → "New Request" and fill out the asset request form. Your manager will receive the request for approval.',
    tags: ['assets', 'request', 'new']
  },
  {
    id: 'request-status',
    category: 'Requests',
    question: 'How do I check the status of my request?',
    answer: 'Visit "My Requests" → "View Requests" to see all your submitted requests along with their current status (Pending, Approved, or Rejected).',
    tags: ['request', 'status', 'track']
  },
  {
    id: 'request-cancel',
    category: 'Requests',
    question: 'Can I cancel a pending request?',
    answer: 'Yes, you can cancel any request that is still in "Pending" status. Go to "My Requests", find the request, and click the "Cancel" button.',
    tags: ['request', 'cancel', 'delete']
  },
  {
    id: 'profile-update',
    category: 'Profile',
    question: 'How do I update my profile information?',
    answer: 'Click on your avatar in the top-right corner and select "Profile". You can update your contact information, preferences, and other details from there.',
    tags: ['profile', 'update', 'settings']
  },
  {
    id: 'password-change',
    category: 'Profile',
    question: 'How do I change my password?',
    answer: 'Go to your profile page and look for the "Change Password" section. Enter your current password and your new password twice to confirm.',
    tags: ['password', 'security', 'change']
  },
  {
    id: 'history-view',
    category: 'History',
    question: 'Where can I see the history of my asset assignments?',
    answer: 'Your asset assignment history is available in "My Assets" page. Each asset card shows the assignment date and any transfer history.',
    tags: ['history', 'assignments', 'tracking']
  },
  {
    id: 'support-contact',
    category: 'General',
    question: 'How do I contact support?',
    answer: 'You can reach our support team via the "Contact Support" button in this dialog, or directly email helpdesk@company.com. Our team responds within 24 hours during business days.',
    tags: ['support', 'contact', 'help']
  },
];

const quickHelpTopics = [
  {
    title: 'Getting Started',
    description: 'Learn the basics of navigating and using the system',
    icon: BookIcon,
    color: 'primary' as const
  },
  {
    title: 'Managing Assets',
    description: 'View and manage your assigned assets',
    icon: ComputerIcon,
    color: 'success' as const
  },
  {
    title: 'Submitting Requests',
    description: 'Request new assets or report issues',
    icon: AssignmentIcon,
    color: 'info' as const
  },
  {
    title: 'Maintenance & Support',
    description: 'Get help when you need it',
    icon: MaintenanceIcon,
    color: 'warning' as const
  },
];

const contactInfo = [
  {
    title: 'IT Help Desk',
    description: 'For technical issues and asset problems',
    methods: [
      { type: 'phone', value: '+1 (555) 123-4567', icon: PhoneIcon },
      { type: 'email', value: 'helpdesk@company.com', icon: EmailIcon },
    ],
    hours: 'Mon-Fri 8:00 AM - 6:00 PM'
  },
  {
    title: 'Asset Management',
    description: 'For asset requests and transfers',
    methods: [
      { type: 'phone', value: '+1 (555) 123-4568', icon: PhoneIcon },
      { type: 'email', value: 'assets@company.com', icon: EmailIcon },
    ],
    hours: 'Mon-Fri 9:00 AM - 5:00 PM'
  },
  {
    title: 'HR Support',
    description: 'For account and access issues',
    methods: [
      { type: 'phone', value: '+1 (555) 123-4569', icon: PhoneIcon },
      { type: 'email', value: 'hr@company.com', icon: EmailIcon },
    ],
    hours: 'Mon-Fri 9:00 AM - 5:00 PM'
  },
];

const HelpSupportDialog: React.FC<HelpSupportDialogProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    priority: 'Medium',
    message: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    category: '',
    rating: 0,
    message: '',
  });

  const categories = ['All', ...Array.from(new Set(faqData.map(faq => faq.category)))];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    toast.success('Support ticket submitted successfully! We\'ll get back to you soon.');
    setContactDialogOpen(false);
    setContactForm({ subject: '', category: '', priority: 'Medium', message: '' });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackForm.message) {
      toast.error('Please provide your feedback');
      return;
    }
    
    toast.success('Thank you for your feedback! It helps us improve the system.');
    setFeedbackDialogOpen(false);
    setFeedbackForm({ category: '', rating: 0, message: '' });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
            Help & Support
          </Typography>
          <IconButton onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {/* Quick Help Topics */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Quick Help Topics
            </Typography>
            <Grid container spacing={2}>
              {quickHelpTopics.map((topic) => (
                <Grid item xs={12} sm={6} md={3} key={topic.title}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          p: 2,
                          borderRadius: '50%',
                          bgcolor: `${topic.color}.light`,
                          color: `${topic.color}.main`,
                          mb: 2,
                        }}
                      >
                        <topic.icon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {topic.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {topic.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* FAQ Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Frequently Asked Questions
            </Typography>

            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, minWidth: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    variant={selectedCategory === category ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {filteredFAQs.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No FAQs found matching your search.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              filteredFAQs.map((faq) => (
                <Accordion key={faq.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Typography sx={{ fontWeight: 500, flexGrow: 1 }}>
                        {faq.question}
                      </Typography>
                      <Chip label={faq.category} size="small" color="primary" variant="outlined" />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>

          {/* Contact Information */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              {contactInfo.map((contact) => (
                <Grid item xs={12} md={4} key={contact.title}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        {contact.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {contact.description}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <List dense>
                        {contact.methods.map((method, idx) => (
                          <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <method.icon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={method.value}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        ))}
                        <ListItem disablePadding>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <ScheduleIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={contact.hours}
                            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              startIcon={<ContactSupportIcon />}
              onClick={() => setContactDialogOpen(true)}
            >
              Contact Support
            </Button>
            <Button
              variant="outlined"
              startIcon={<FeedbackIcon />}
              onClick={() => setFeedbackDialogOpen(true)}
            >
              Send Feedback
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Contact Support Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Subject"
              fullWidth
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={contactForm.category}
                label="Category"
                onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
              >
                <MenuItem value="Technical">Technical Issue</MenuItem>
                <MenuItem value="Asset">Asset Related</MenuItem>
                <MenuItem value="Account">Account Issue</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={contactForm.priority}
                label="Priority"
                onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Message"
              fullWidth
              multiline
              rows={4}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setContactDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitContact}>Submit</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Feedback Category</InputLabel>
              <Select
                value={feedbackForm.category}
                label="Feedback Category"
                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
              >
                <MenuItem value="Bug">Bug Report</MenuItem>
                <MenuItem value="Feature">Feature Request</MenuItem>
                <MenuItem value="Improvement">Improvement Suggestion</MenuItem>
                <MenuItem value="General">General Feedback</MenuItem>
              </Select>
            </FormControl>
            <Box>
              <Typography component="legend" gutterBottom>Rate your experience</Typography>
              <Rating
                value={feedbackForm.rating}
                onChange={(_, value) => setFeedbackForm({ ...feedbackForm, rating: value || 0 })}
                size="large"
              />
            </Box>
            <TextField
              label="Your Feedback"
              fullWidth
              multiline
              rows={4}
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmitFeedback}>Submit Feedback</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HelpSupportDialog;
