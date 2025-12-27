# 🚀 Deployment Checklist

## 📋 Pre-Deployment

### Database Setup
- [ ] Run `database-messages-schema.sql` in Supabase SQL Editor
- [ ] Run `database-rooms-add-created-by.sql` in Supabase SQL Editor
- [ ] Run `database-messages-add-selfie.sql` in Supabase SQL Editor
- [ ] Run `database-players-add-avatar.sql` in Supabase SQL Editor

### Supabase Storage
- [ ] Create bucket: `player-selfies` (Public, 5MB limit)
- [ ] Add upload policy for `player-selfies`
- [ ] Add read policy for `player-selfies`
- [ ] Create bucket: `room-videos` (Public, 100MB limit) - optional

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] No sensitive keys in client code

### Code Quality
- [ ] All TypeScript errors fixed
- [ ] All console.logs removed (except critical errors)
- [ ] No `@ts-ignore` or `as any` in production code
- [ ] Error boundaries in place
- [ ] Loading states for all async operations

### Testing
- [ ] Create a room ✅
- [ ] Start a session ✅
- [ ] Play through all 3 game types ✅
- [ ] Test multiplayer with 2+ players ✅
- [ ] Send feedback with selfie ✅
- [ ] Check inbox receives messages ✅
- [ ] Test QR code scanning ✅
- [ ] Test on mobile device 📱
- [ ] Test shake-to-celebrate on mobile ✅
- [ ] Test achievements system ✅
- [ ] Test progress bar ✅
- [ ] Test copy link button ✅
- [ ] Test avatar selection ✅

### Performance
- [ ] Run `npm run build` successfully
- [ ] Check bundle size (should be < 500KB)
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] No memory leaks

### Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies tested
- [ ] No API keys exposed
- [ ] Auth redirects working

## 🌐 Deployment (Vercel)

### Setup
```bash
npm i -g vercel
vercel login
```

### Deploy
```bash
# Test deployment
vercel

# Production deployment
vercel --prod
```

### Environment Variables on Vercel
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy after adding variables

### Post-Deployment
- [ ] Test production URL
- [ ] Check all features work
- [ ] Test on different devices
- [ ] Monitor errors in Vercel logs
- [ ] Check Supabase logs

## 🐛 Known Issues to Fix

### Critical
- [ ] TypeScript build errors in AdminDashboard
- [ ] Supabase types need regeneration
- [ ] Console.logs in production code

### Nice to Have
- [ ] Better error messages for users
- [ ] Loading spinners everywhere
- [ ] Toast notifications instead of alerts
- [ ] Offline mode handling

## 📝 Post-Launch

### Monitoring
- [ ] Setup error tracking (Sentry?)
- [ ] Monitor Supabase usage
- [ ] Check Vercel analytics
- [ ] User feedback collection

### Documentation
- [ ] Update README with production URL
- [ ] Add user guide
- [ ] Document admin features
- [ ] API documentation (if needed)

## 🎉 Launch!

Once all checkboxes are ticked, you're ready to launch! 🚀

### Quick Commands
```bash
# Build check
npm run build

# Lint check
npm run lint

# Deploy
vercel --prod
```

### Support URLs
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Next.js Docs**: https://nextjs.org/docs
