## **RLS Policy Summary:**

### **🔐 User-Specific Tables (Private Data)**
- **users**: Users can only view/edit their own profile; admins can manage all users
- **user_bookmarks**: Users can CRUD their own bookmarks only
- **user_alerts**: Users can CRUD their own alerts only
- **alert_notifications**: Users can view/update/delete their own notifications

### **📊 Public Read Access (Legislative Data)**
All these tables are publicly readable (transparency is key!):
- jurisdictions, legislative_bodies, legislators
- meetings, meeting_attendees, transcription_segments
- issues (only active ones for public; admins see all)
- bills, bill_cosponsors, legislative_actions, vote_records
- legislator_statistics, issue_statistics

### **✏️ Admin/Moderator Write Access**
- **Admins only**: jurisdictions, legislative_bodies
- **Admins + Moderators**: legislators, meetings, transcriptions, issues, bills, votes

### **🔧 Service Role Access**
Backend services (using service role key) can:
- Insert notifications and audit logs
- Manage statistics tables
- Process AI-generated data
- Handle automated tasks

### **📝 Audit Logging**
Automatic audit trails for:
- Manual corrections to transcriptions
- Issue categorization changes
- Legislator profile updates
- All user-initiated modifications

## **Key Security Features:**

1. **Role-Based Access Control**: Three roles (user, moderator, admin) with escalating privileges
2. **Service Role Separation**: Backend AI processing uses service role, keeping user data secure
3. **Transparent Government Data**: All legislative content is publicly readable (no login required)
4. **User Privacy**: Personal bookmarks and alerts are completely private
5. **Audit Trail**: All manual corrections are logged with user attribution

## **Next Steps for Supabase Setup:**

```sql
-- In Supabase SQL Editor, you'll also want to:

-- 1. Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE alert_notifications;

-- 2. Create indexes for auth lookups (performance)
CREATE INDEX idx_users_supabase_auth ON users(supabase_user_id);

-- 3. Grant service role permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

**Important Notes:**
- Use `auth.uid()` in your Next.js API routes to get the current user
- Use the **service role key** (never expose it!) for backend AI processing jobs
- Use the **anon key** for public legislative data queries
- The `auth.user_role()` helper function lets you check roles in queries

