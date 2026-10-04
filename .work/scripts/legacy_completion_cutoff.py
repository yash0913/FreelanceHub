from pathlib import Path
path = Path(r"C:\Users\yasha\OneDrive\Desktop\FreelanceDBMS\server\src\utils\profileCompletion.js")
text = path.read_text(encoding="utf-8")
text = text.replace(
    "const hasText = (value) => typeof value === 'string' && value.trim().length > 0\n",
    "const hasText = (value) => typeof value === 'string' && value.trim().length > 0\n\n// Customer records created before the profile-setup schema release may not have\n// organizationType/useCase values because those columns did not previously exist.\nconst PROFILE_SETUP_RELEASED_AT = new Date('2026-10-04T19:45:00+05:30')\n",
    1,
)
text = text.replace(
    "    // Before onboarding fields existed, a saved company name or description was\n    // the available evidence of a usable customer profile. Preserve that state.\n    if (!hasText(profile.organizationType)) {\n      return hasText(profile.companyName) || hasText(profile.bio)\n    }",
    "    // Before onboarding fields existed, a saved company name or description was\n    // the available evidence of a usable customer profile. Preserve that state\n    // only for pre-release accounts; newly created users must satisfy current rules.\n    if (!hasText(profile.organizationType)) {\n      const createdAt = user.createdAt ? new Date(user.createdAt) : null\n      const isLegacyAccount = createdAt && Number.isFinite(createdAt.getTime()) && createdAt < PROFILE_SETUP_RELEASED_AT\n      return Boolean(isLegacyAccount && (hasText(profile.companyName) || hasText(profile.bio)))\n    }",
    1,
)
path.write_text(text, encoding="utf-8")
print("Legacy customer completion is now limited to pre-release accounts.")
