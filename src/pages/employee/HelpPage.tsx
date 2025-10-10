import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Paper,
  IconButton,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContactSupport as ContactSupportIcon,
  Book as BookIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  BugReport as BugReportIcon,
  Feedback as FeedbackIcon,
  Assignment as AssignmentIcon,
  Computer as ComputerIcon,
  Build as MaintenanceIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layout/Layout';

const HelpPage = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    category: 'general',
    rating: 5,
    message: '',
  });

  // FAQ Data
  const faqData = [
    {
      id: 'assets-view',
      category: 'Assets',
      question: 'How do I view my assigned assets?',
      answer: 'Navigate to "My Assets" from the sidebar or dashboard. You can see all assets assigned to you, their status, location, and warranty information. Use the search feature to quickly find specific assets.',
      tags: ['assets', 'view', 'assigned'],
    },
    {
      id: 'assets-report-issue',
      category: 'Assets',
      question: 'How do I report an issue with my asset?',
      answer: 'You can report issues in several ways: 1) Click "Report Issue" on any asset card in "My Assets", 2) Use the "Report Issue" quick action on the dashboard, 3) Go to "Requests" and create a new maintenance request.',
      tags: ['assets', 'issue', 'maintenance', 'report'],
    },
    {
      id: 'requests-new-asset',
      category: 'Requests',
      question: 'How do I request a new asset?',
      answer: 'Go to the "Requests" page and click "Request New Asset". Fill out the form with the asset category, description, and business justification. Your request will be reviewed by the appropriate manager.',
      tags: ['requests', 'new', 'asset'],
    },
    {
      id: 'requests-status',
      category: 'Requests',
      question: 'How do I check the status of my requests?',
      answer: 'Visit the "Requests" page to see all your submitted requests. Each request shows its current status (pending, approved, rejected, in progress). You can also edit or cancel pending requests.',
      tags: ['requests', 'status', 'track'],
    },
    {
      id: 'profile-update',
      category: 'Profile',
      question: 'How do I update my profile information?',
      answer: 'Go to "Profile" from the sidebar, click "Edit", update your information, and save changes. Note that some fields like Employee ID and Department cannot be changed and require HR assistance.',
      tags: ['profile', 'update', 'personal'],
    },
    {
      id: 'profile-password',
      category: 'Profile',
      question: 'How do I change my password?',
      answer: 'In your Profile page, click "Change Password" in the Security section. Enter your current password and new password. Passwords must be at least 8 characters long.',
      tags: ['profile', 'password', 'security'],
    },
    {
      id: 'history-view',
      category: 'History',
      question: 'How do I view my activity history?',
      answer: 'The "History" page shows all your asset-related activities including assignments, requests, maintenance, and audits. Use filters to narrow down by time period or search for specific activities.',
      tags: ['history', 'activity', 'track'],
    },
    {
      id: 'notifications',
      category: 'General',
      question: 'How do I manage my notifications?',
      answer: 'In your Profile page, scroll to "Notification Settings" to control which types of notifications you receive via email or SMS. You can enable/disable specific notification categories.',
      tags: ['notifications', 'settings', 'email'],
    },
  ];

  // Quick Help Topics
  const quickHelpTopics = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of using the system',
      icon: <BookIcon />,
      color: 'primary',
    },
    {
      title: 'Managing Assets',
      description: 'View and manage your assigned assets',
      icon: <ComputerIcon />,
      color: 'secondary',
    },
    {
      title: 'Submitting Requests',
      description: 'Request new assets or report issues',
      icon: <AssignmentIcon />,
      color: 'success',
    },
    {
      title: 'Maintenance & Support',
      description: 'Get help with asset maintenance',
      icon: <MaintenanceIcon />,
      color: 'warning',
    },
  ];

  // Contact Information
  const contactInfo = [
    {
      title: 'IT Help Desk',
      description: 'For technical issues and asset problems',
      methods: [
        { type: 'phone', value: '+1 (555) 123-4567', icon: <PhoneIcon /> },
        { type: 'email', value: 'helpdesk@company.com', icon: <EmailIcon /> },
      ],
      hours: 'Mon-Fri 8:00 AM - 6:00 PM',
    },
    {
      title: 'Asset Management',
      description: 'For asset requests and inventory questions',
      methods: [
        { type: 'phone', value: '+1 (555) 123-4568', icon: <PhoneIcon /> },
        { type: 'email', value: 'assets@company.com', icon: <EmailIcon /> },
      ],
      hours: 'Mon-Fri 9:00 AM - 5:00 PM',
    },
    {
      title: 'HR Support',
      description: 'For profile and account-related questions',
      methods: [
        { type: 'phone', value: '+1 (555) 123-4569', icon: <PhoneIcon /> },
        { type: 'email', value: 'hr@company.com', icon: <EmailIcon /> },
      ],
      hours: 'Mon-Fri 9:00 AM - 5:00 PM',
    },
  ];

  const handleFaqExpand = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
  };

  const handleSubmitContact = () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Support ticket submitted successfully! We\'ll get back to you soon.');
    setContactDialogOpen(false);
    setContactForm({
      subject: '',
      category: 'general',
      priority: 'medium',
      message: '',
    });
  };

  const handleSubmitFeedback = () => {
    if (!feedbackForm.message) {
      toast.error('Please provide your feedback');
      return;
    }

    toast.success('Thank you for your feedback! It helps us improve the system.');
    setFeedbackDialogOpen(false);
    setFeedbackForm({
      category: 'general',
      rating: 5,
      message: '',
    });
  };

  const filteredFaqs = faqData.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <DashboardLayout title="Help & Support">
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Help & Support
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Get help with using the Asset Management System
          </Typography>
        </Box>

        {/* Quick Help Topics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {quickHelpTopics.map((topic, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  '&:hover': { elevation: 4 }
                }}
                onClick={() => toast.info(`${topic.title} guide coming soon!`)}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${topic.color}.main`, 
                      width: 60, 
                      height: 60, 
                      mx: 'auto', 
                      mb: 2 
                    }}
                  >
                    {topic.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
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

        <Grid container spacing={3}>
          {/* FAQ Section */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Frequently Asked Questions
                </Typography>
                
                {/* Search FAQs */}
                <TextField
                  fullWidth
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />

                {/* FAQ Accordions */}
                {filteredFaqs.map((faq) => (
                  <Accordion
                    key={faq.id}
                    expanded={expandedFaq === faq.id}
                    onChange={handleFaqExpand(faq.id)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls={`${faq.id}-content`}
                      id={`${faq.id}-header`}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography sx={{ flexGrow: 1 }}>
                          {faq.question}
                        </Typography>
                        <Chip 
                          label={faq.category} 
                          size="small" 
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2">
                        {faq.answer}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {faq.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {filteredFaqs.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      No FAQs found matching your search. Try different keywords or contact support.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Contact & Support */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              {/* Contact Support */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Need More Help?
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ContactSupportIcon />}
                      onClick={() => setContactDialogOpen(true)}
                      sx={{ mb: 2 }}
                    >
                      Contact Support
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<FeedbackIcon />}
                      onClick={() => setFeedbackDialogOpen(true)}
                      sx={{ mb: 2 }}
                    >
                      Send Feedback
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BugReportIcon />}
                      onClick={() => toast.info('Bug report form coming soon!')}
                    >
                      Report Bug
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    {contactInfo.map((contact, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {contact.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {contact.description}
                        </Typography>
                        <List dense>
                          {contact.methods.map((method, methodIndex) => (
                            <ListItem key={methodIndex} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {method.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={method.value}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                        <Typography variant="caption" color="text.secondary">
                          Hours: {contact.hours}
                        </Typography>
                        {index < contactInfo.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Contact Support Dialog */}
        <Dialog
          open={contactDialogOpen}
          onClose={() => setContactDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Contact Support
              <IconButton onClick={() => setContactDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    value={contactForm.category}
                    onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  >
                    <MenuItem value="general">General Question</MenuItem>
                    <MenuItem value="assets">Asset Management</MenuItem>
                    <MenuItem value="requests">Requests</MenuItem>
                    <MenuItem value="technical">Technical Issue</MenuItem>
                    <MenuItem value="account">Account & Profile</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Priority"
                    value={contactForm.priority}
                    onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    multiline
                    rows={4}
                    required
                    placeholder="Describe your issue or question in detail..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSubmitContact}
            >
              Submit Ticket
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Send Feedback
              <IconButton onClick={() => setFeedbackDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Feedback Category"
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                  >
                    <MenuItem value="general">General Feedback</MenuItem>
                    <MenuItem value="feature">Feature Request</MenuItem>
                    <MenuItem value="usability">Usability</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                    <MenuItem value="bug">Bug Report</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Overall Rating
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={feedbackForm.rating === rating ? 'contained' : 'outlined'}
                        size="small"
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                      >
                        {rating}
                      </Button>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Feedback"
                    value={feedbackForm.message}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                    multiline
                    rows={4}
                    required
                    placeholder="Share your thoughts, suggestions, or report issues..."
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSubmitFeedback}
            >
              Send Feedback
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
};

export default HelpPage;