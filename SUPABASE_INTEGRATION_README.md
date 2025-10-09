# Water Tracking App - Supabase Backend Integration

## 🚀 **Complete Supabase Integration**

Your water tracking app now has full backend integration with Supabase, including authentication, real-time sync, and offline support!

## ✅ **What's Been Implemented**

### **🔐 Authentication System**
- **Sign Up/Sign In** with email and password
- **Password Reset** via email
- **Session Management** with automatic refresh
- **User Profile Creation** on signup
- **Secure Authentication** with Supabase Auth

### **☁️ Cloud Database**
- **PostgreSQL Database** with Row Level Security
- **Real-time Subscriptions** for live updates
- **Automatic Data Sync** between devices
- **User Data Isolation** with RLS policies

### **📱 Offline Support**
- **Offline Queue** for pending operations
- **Local Storage Fallback** when offline
- **Automatic Sync** when connection restored
- **Conflict Resolution** for data conflicts

### **🔄 Real-time Features**
- **Live Updates** across all devices
- **Instant Sync** of water logs and settings
- **Network Status Monitoring**
- **Background Sync** capabilities

## 🛠 **Setup Instructions**

### **1. Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready

### **2. Run Database Schema**
Copy and paste this SQL into the Supabase SQL Editor:

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  daily_goal_ml INTEGER DEFAULT 2000,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  quick_add_amounts INTEGER[] DEFAULT ARRAY[250, 500, 1000],
  unit_preference VARCHAR(10) DEFAULT 'ml',
  notifications_enabled BOOLEAN DEFAULT false,
  reminder_times TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water logs table
CREATE TABLE water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT,
  source VARCHAR(10) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX water_logs_user_id_idx ON water_logs(user_id);
CREATE INDEX water_logs_logged_at_idx ON water_logs(logged_at DESC);
CREATE INDEX water_logs_user_date_idx ON water_logs(user_id, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for water_logs
CREATE POLICY "Users can view own water logs" ON water_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs" ON water_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs" ON water_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs" ON water_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_water_logs_updated_at BEFORE UPDATE ON water_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### **3. Get Supabase Credentials**
1. Go to **Settings > API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public** key

### **4. Update Configuration**
Update `config/supabase.ts` with your credentials:

```typescript
export const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-anon-key-here',
  appUrl: 'exp://localhost:8081', // or your app URL
};
```

### **5. Set Environment Variables**
Create a `.env` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_URL=exp://localhost:8081
```

## 🎯 **Features Overview**

### **Authentication Flow**
1. **Sign Up**: Create account with email/password
2. **Sign In**: Authenticate with credentials
3. **Auto-login**: Persistent sessions across app restarts
4. **Password Reset**: Email-based password recovery
5. **Sign Out**: Secure logout with session cleanup

### **Data Synchronization**
- **Real-time Updates**: Changes sync instantly across devices
- **Offline Support**: App works without internet connection
- **Conflict Resolution**: Smart handling of data conflicts
- **Background Sync**: Automatic sync when connection restored

### **Security Features**
- **Row Level Security**: Users can only access their own data
- **Encrypted Storage**: All data encrypted in transit and at rest
- **Session Management**: Secure token-based authentication
- **Input Validation**: All inputs validated and sanitized

## 📱 **App Structure**

```
├── services/
│   ├── supabase.ts              # Supabase client
│   ├── authService.ts           # Authentication operations
│   └── databaseService.ts       # Database CRUD operations
├── context/
│   ├── AuthContext.tsx          # Authentication state
│   └── WaterTrackingContext.tsx # Water tracking with sync
├── app/
│   ├── (auth)/                  # Authentication screens
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   └── (tabs)/                  # Main app screens
├── components/
│   ├── auth/                    # Auth components
│   └── common/                  # Shared components
├── hooks/
│   ├── useAuth.ts
│   ├── useNetworkStatus.ts
│   └── useSupabaseSync.ts
└── utils/
    └── offlineQueue.ts           # Offline operations queue
```

## 🔧 **Technical Implementation**

### **Authentication**
- **Supabase Auth** for user management
- **JWT Tokens** for secure sessions
- **Automatic Refresh** of expired tokens
- **Email Verification** for new accounts

### **Database**
- **PostgreSQL** with full ACID compliance
- **Real-time Subscriptions** for live updates
- **Optimized Queries** with proper indexing
- **Data Validation** at database level

### **Offline Support**
- **AsyncStorage** for local data persistence
- **Operation Queue** for offline actions
- **Smart Sync** with conflict resolution
- **Network Detection** for sync triggers

### **Real-time Sync**
- **WebSocket Connections** for live updates
- **Event-driven Architecture** for data changes
- **Optimistic Updates** for better UX
- **Error Handling** with retry mechanisms

## 🚀 **Getting Started**

1. **Install Dependencies**:
   ```bash
   npm install @supabase/supabase-js @react-native-community/netinfo
   ```

2. **Configure Supabase**:
   - Update `config/supabase.ts` with your credentials
   - Set environment variables

3. **Run Database Schema**:
   - Execute the SQL in Supabase SQL Editor

4. **Start the App**:
   ```bash
   npx expo start
   ```

## 🎉 **What You Can Do Now**

- **Create Accounts**: Users can sign up with email/password
- **Sign In/Out**: Secure authentication with persistent sessions
- **Track Water**: All data syncs to the cloud automatically
- **Work Offline**: App functions without internet connection
- **Real-time Updates**: Changes appear instantly on all devices
- **Reset Passwords**: Email-based password recovery
- **Secure Data**: All data protected with Row Level Security

## 🔍 **Testing the Integration**

1. **Sign Up**: Create a new account
2. **Add Water Logs**: Track your water intake
3. **Go Offline**: Turn off internet and continue using the app
4. **Come Back Online**: Watch data sync automatically
5. **Check Other Devices**: Sign in on another device to see synced data

## 🛡️ **Security Notes**

- **Never store passwords** in the app
- **All data encrypted** in transit and at rest
- **User isolation** with Row Level Security
- **Input validation** on both client and server
- **Secure token handling** with automatic refresh

## 📈 **Next Steps**

- **Email Templates**: Customize Supabase email templates
- **Push Notifications**: Add reminder notifications
- **Analytics**: Track user engagement
- **Backup**: Set up automated database backups
- **Monitoring**: Add error tracking and performance monitoring

---

**🎊 Congratulations! Your water tracking app now has enterprise-grade backend infrastructure with Supabase!**
