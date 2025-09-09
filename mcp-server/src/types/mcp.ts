// Core MCP Server Types
export interface PageInfo {
  title: string;
  url: string;
  path: string;
  timestamp: string;
}

export interface ClickableElement {
  name: string;
  selector: string;
  text: string;
  type: string;
  visible: boolean;
  position?: {
    x: number;
    y: number;
  };
}

export interface ClickResult {
  success: boolean;
  elementName: string;
  message: string;
  newUrl?: string;
}

export interface NavigationResult {
  success: boolean;
  targetPage: string;
  currentUrl: string;
  message: string;
}

export interface BookingFormResult {
  success: boolean;
  fieldsUpdated: string[];
  message: string;
  validationErrors?: string[];
}
