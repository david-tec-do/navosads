-- Insert initial Media data for NewsBreak
INSERT INTO "Media" (id, "displayName", description, "logoUrl", "documentationUrl", "isActive", "createdAt", "updatedAt") 
VALUES (
  'newsbreak',
  'NewsBreak',
  'NewsBreak Ads Platform',
  NULL,
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

