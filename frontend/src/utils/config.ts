/**
 * Stores configuration constants for frontend to interact with the backend services.
 * @deprecated Use apiConfig from @/lib/api-config instead
 */

import { apiConfig } from "@/lib/api-config";

export const collaborationConfig = {
  HTTP_URL: apiConfig.collaborationService.httpURL,
  WS_URL: apiConfig.collaborationService.wsURL,
};
