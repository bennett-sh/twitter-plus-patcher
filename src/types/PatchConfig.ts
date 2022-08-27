
export interface PatchConfig {
  appName?:             string;
  appVersion?:          {
    name?:              string;
    code?:              number;
  };
  appIcon?:             {
    foreground?:        string;
    background?:        string;
    monochrome?:        string;
  };
  packageName?:         string;
  materialYou?:         boolean;
  removeTranslations?:  boolean;
  keystore?:            {
    path:               string;
    password:           string;
    keyAlias:           string;
  };
  patches?:             string[];
}
