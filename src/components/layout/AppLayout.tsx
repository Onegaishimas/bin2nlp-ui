import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Upload as UploadIcon,
  ViewList as JobsIcon,
  Assessment as ResultsIcon,
  Settings as SettingsIcon,
  Health as HealthIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Dashboard',
    icon: <HomeIcon />,
    path: '/',
  },
  {
    id: 'upload',
    label: 'Upload & Analyze',
    icon: <UploadIcon />,
    path: '/upload',
  },
  {
    id: 'jobs',
    label: 'Job Status',
    icon: <JobsIcon />,
    path: '/jobs',
  },
  {
    id: 'results',
    label: 'Results',
    icon: <ResultsIcon />,
    path: '/results',
  },
  {
    id: 'providers',
    label: 'LLM Providers',
    icon: <SettingsIcon />,
    path: '/providers',
  },
  {
    id: 'health',
    label: 'System Health',
    icon: <HealthIcon />,
    path: '/health',
  },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          bin2nlp
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => {
                // Navigation logic will be implemented with routing
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Binary Analysis Platform
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            v1.0.0
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};