# Site Control Audit - May 2026

## Backend Admin Routes (`/api/v1/admin/*`)

### User Management
| Endpoint | Status | Description |
|----------|--------|-------------|
| GET `/admin/users?q=` | ✅ | Search users by username/email |
| GET `/admin/users/:id` | ✅ | Get user details + moderation history |

### Site Admin Management  
| Endpoint | Status | Description |
|----------|--------|-------------|
| GET `/admin/site-admins` | ✅ | List all site admins |
| POST `/admin/site-admins` | ✅ | Grant admin role (SiteOwner only for SiteOwner role) |
| DELETE `/admin/site-admins/:userId` | ✅ | Revoke admin role |

### Timeline Management
| Endpoint | Status | Description |
|----------|--------|-------------|
| POST `/admin/timelines/merge` | ✅ | Merge timelines (SiteOwner only) |

### Blocklists
| Endpoint | Status | Description |
|----------|--------|-------------|
| POST `/admin/blocklists/usernames` | ✅ | Block username |
| POST `/admin/blocklists/timeline-names` | ✅ | Block timeline name |
| GET `/admin/blocklists/*` | ❌ | No list/view endpoint exists |
| DELETE `/admin/blocklists/*` | ❌ | No unblock endpoint exists |

---

## Frontend Site Control Page

### Tab Structure
| Tab | Status | Notes |
|-----|--------|-------|
| Global Reports | ✅ | Pending/Reviewing/Resolved with filters |
| Admin List | ✅ | View/manage site admins |
| Logs | ✅ | System logs viewer |
| Site Settings | ✅ | Landing page customization |

### Global Reports Features
| Feature | Status | Notes |
|---------|--------|-------|
| Report type filter (all/post/user/timeline) | ✅ | Working |
| Status tabs (pending/reviewing/resolved) | ✅ | Working |
| User moderation dialog | ✅ | require_username_change, restrict_user, suspend_user |
| Show offensive username on resolved | ✅ | Just added - displays `subject_value` |
| Report details view | ✅ | Shows reporter, reason, content |
| Resolve with verdict | ✅ | Working |
| Timeline warning lift | ✅ | `unbanTimelineFromReport` |
| Timeline remove event | ✅ | `liftTimelineWarningFromReport` |

### User Moderation Actions
| Action | Status | Backend Support | Frontend Dialog |
|--------|--------|-----------------|-----------------|
| Require Username Change | ✅ | `require_username_change` | ✅ With block username checkbox |
| Temporary Restriction | ✅ | `restrict` | ✅ With datetime picker |
| Suspend User | ✅ | `suspend` | ✅ With temp/permanent toggle |

### Missing/Partial Features
| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Blocklist management UI | ❌ | Medium | Can add but can't view/remove blocked names |
| User lookup/deep search | ⚠️ | Low | Basic search exists, no advanced filters |
| Timeline merge UI | ❌ | Low | Backend exists, no frontend |
| Bulk actions on reports | ❌ | Low | Single resolution only |
| Report assignment | ❌ | Low | No "claim" system for reviewers |
| Activity audit log | ❌ | Low | No admin action history |

---

## Comparison with Legacy System

### What's Better
- User moderation actions properly integrated
- Passport cache system for real-time moderation state
- Offensive username now stored and displayed

### What's Missing vs Legacy
- Blocklist visibility/management
- More granular audit trails
- Advanced user search filters

### API Compatibility Notes
- `/api/v1/admins/site` → Now `/api/v1/admin/site-admins`
- `/api/v1/reports/site` → Now `/api/v1/reports?scope=site`
- Report resolution payload changed - now uses `action` field with moderation types

---

## Recommendations

1. **Add Blocklist Management Tab** - View and remove blocked usernames/timeline names
2. **Add Timeline Merge UI** - Frontend interface for SiteOwner timeline merging
3. **Enhance User Details** - Show full moderation history, active restrictions
4. **Add Audit Log** - Track all admin actions for accountability
