# Supabase Authentication System

This project now uses a custom-built Supabase Auth UI component system for React Native, providing a comprehensive authentication experience.

## Features

- **Email/Password Authentication**: Sign up, sign in, and password reset
- **OAuth Providers**: Google and GitHub integration (configurable)
- **Modern UI**: Clean, responsive design with Material Design components
- **Error Handling**: Comprehensive error messages and validation
- **TypeScript Support**: Full type safety throughout
- **Context Integration**: Seamless integration with React Context for state management

## Components

### SupabaseAuth Component

The main authentication component located at `components/auth/SupabaseAuth.tsx`:

```tsx
<SupabaseAuth
  onAuthSuccess={handleAuthSuccess}
  onAuthError={handleAuthError}
  view="sign_in" // or "sign_up", "forgotten_password"
  providers={['google', 'github']}
  appearance={{
    theme: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#ffffff',
      text: '#1f2937',
    },
  }}
  showLinks={true}
  additionalData={{
    app_name: 'Water Tracker',
  }}
/>
```

### Props

- `onAuthSuccess?: () => void` - Callback when authentication succeeds
- `onAuthError?: (error: string) => void` - Callback when authentication fails
- `appearance?: object` - Custom styling options
- `providers?: string[]` - OAuth providers to enable
- `view?: 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password'` - Initial view
- `redirectTo?: string` - URL to redirect to after auth
- `showLinks?: boolean` - Show navigation links between views
- `additionalData?: object` - Additional user metadata

## Authentication Flow

1. **App Launch**: The app checks authentication status via `AuthContext`
2. **Unauthenticated**: Redirects to `/(auth)/login`
3. **Authenticated**: Redirects to `/(tabs)` main app
4. **Sign Out**: Available in settings, returns to login screen

## Screens

- **Login** (`app/(auth)/login.tsx`): Sign in with email or OAuth
- **Sign Up** (`app/(auth)/signup.tsx`): Create new account
- **Reset Password** (`app/(auth)/reset-password.tsx`): Password reset flow

## Context Integration

The `AuthContext` provides:

```tsx
const { 
  user,           // Current user object
  session,        // Current session
  isLoading,      // Loading state
  isAuthenticated, // Authentication status
  error,          // Error messages
  signOut,        // Sign out function
  clearError      // Clear error function
} = useAuth();
```

## Supabase Configuration

Make sure your Supabase client is properly configured in `services/supabase.ts`:

```tsx
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url, 
  SUPABASE_CONFIG.anonKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
```

## OAuth Setup

To enable OAuth providers:

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable desired providers (Google, GitHub, etc.)
4. Configure OAuth credentials
5. Add redirect URLs for your app

## Testing

The authentication system can be tested by:

1. **Email Sign Up**: Create a new account with email/password
2. **Email Sign In**: Sign in with existing credentials
3. **Password Reset**: Test the forgot password flow
4. **OAuth**: Test Google/GitHub sign in (if configured)
5. **Sign Out**: Test sign out from settings screen

## Error Handling

The system handles various error scenarios:

- Invalid email format
- Weak passwords
- Network errors
- OAuth configuration issues
- Session expiration

All errors are displayed to the user with helpful messages and suggestions.

## Customization

The UI can be customized through the `appearance` prop:

- **Theme**: Light, dark, or auto
- **Colors**: Primary, secondary, background, text colors
- **Layout**: Responsive design that adapts to screen size
- **Typography**: Consistent with Material Design

## Security Features

- **Password Validation**: Minimum length and complexity requirements
- **Email Verification**: Optional email confirmation
- **Session Management**: Automatic token refresh and persistence
- **Secure Storage**: Credentials stored securely on device
- **HTTPS Only**: All communication over secure connections
