from pathlib import Path
ROOT = Path(r"C:\Users\yasha\OneDrive\Desktop\FreelanceDBMS")

p = ROOT / "server/src/utils/profileCompletion.js"
s = p.read_text(encoding="utf-8")
s = s.replace(
    "// Customer records created before the profile-setup schema release may not have\n// organizationType/useCase values because those columns did not previously exist.\nconst PROFILE_SETUP_RELEASED_AT = new Date('2026-10-04T19:45:00+05:30')\n",
    "",
    1,
)
s = s.replace(
    "    // Before onboarding fields existed, a saved company name or description was\n    // the available evidence of a usable customer profile. Preserve that state\n    // only for pre-release accounts; newly created users must satisfy current rules.\n    if (!hasText(profile.organizationType)) {\n      const createdAt = user.createdAt ? new Date(user.createdAt) : null\n      const isLegacyAccount = createdAt && Number.isFinite(createdAt.getTime()) && createdAt < PROFILE_SETUP_RELEASED_AT\n      return Boolean(isLegacyAccount && (hasText(profile.companyName) || hasText(profile.bio)))\n    }",
    "    // Migration backfills the backend-owned flag for legacy customers with prior\n    // profile data. New accounts start false and cannot use this compatibility path.\n    if (!hasText(profile.organizationType)) {\n      return Boolean(user.isProfileCompleted === true && (hasText(profile.companyName) || hasText(profile.bio)))\n    }",
    1,
)
p.write_text(s, encoding="utf-8")

p = ROOT / "server/src/controllers/marketplaceController.js"
s = p.read_text(encoding="utf-8")
needle = """    if (req.user.role === 'CUSTOMER') {
      const customerData = {
"""
replacement = """    if (req.user.role === 'CUSTOMER') {
      if (organizationType === null) {
        const existingCustomerProfile = await prisma.customerProfile.findUnique({
          where: { userId: req.user.id },
          select: { organizationType: true }
        })
        if (existingCustomerProfile?.organizationType) {
          return fail(res, 'Customer / organization type is required')
        }
      }
      const customerData = {
"""
if needle not in s:
    raise RuntimeError("Customer update branch not found")
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding="utf-8")

migration = ROOT / "server/prisma/migrations/20261004194500_add_profile_setup_and_progress_tracker/migration.sql"
backfill = """

-- Backfill the backend-owned completion flag for profiles that were valid before
-- the onboarding fields were introduced. New accounts are not affected.
UPDATE `User` AS u
INNER JOIN `FreelancerProfile` AS fp ON fp.`userId` = u.`id`
SET u.`isProfileCompleted` = true
WHERE u.`role` = 'FREELANCER'
  AND TRIM(COALESCE(u.`professionalTitle`, '')) <> ''
  AND TRIM(COALESCE(fp.`bio`, '')) <> '';

UPDATE `User` AS u
INNER JOIN `CustomerProfile` AS cp ON cp.`userId` = u.`id`
SET u.`isProfileCompleted` = true
WHERE u.`role` = 'CUSTOMER'
  AND (TRIM(COALESCE(cp.`companyName`, '')) <> '' OR TRIM(COALESCE(cp.`bio`, '')) <> '');
"""
with migration.open("a", encoding="utf-8", newline="") as f:
    f.write(backfill)

print("Applied migration-driven legacy profile compatibility; migration remains unexecuted.")
