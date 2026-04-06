/**
 * Branding Configuration
 * 
 * Customize this file to match your instance's branding.
 * This keeps personal/instance-specific data out of the main codebase.
 */

export const BRANDING = {
  // Main agent name and emoji
  agentName: process.env.NEXT_PUBLIC_AGENT_NAME || "Exnoria",
  agentEmoji: process.env.NEXT_PUBLIC_AGENT_EMOJI || "🧠",

  // About page — agent identity
  agentLocation: process.env.NEXT_PUBLIC_AGENT_LOCATION || "",
  birthDate: process.env.NEXT_PUBLIC_BIRTH_DATE || "",
  agentAvatar: process.env.NEXT_PUBLIC_AGENT_AVATAR || "",
  agentDescription: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || "CX Intelligence Engine",

  // User/owner information
  ownerUsername: process.env.NEXT_PUBLIC_OWNER_USERNAME || "admin",
  ownerEmail: process.env.NEXT_PUBLIC_OWNER_EMAIL || "admin@exnoria.io",
  ownerCollabEmail: process.env.NEXT_PUBLIC_OWNER_COLLAB_EMAIL || "",

  // Company/organization name
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || "EXNORIA CX INTELLIGENCE",

  // App title (shown in browser tab)
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || "Exnoria",
} as const;

// Helper to get full agent display name
export function getAgentDisplayName(): string {
  return `${BRANDING.agentName} ${BRANDING.agentEmoji}`;
}
