import {authorize} from 'react-native-app-auth';
/**
 * Configs
 */
const authConfig = {
  issuer: 'https://accounts.google.com',
  clientId:
    '544423402645-94akramas0s2v26dplmrd7ulfdirk11b.apps.googleusercontent.com',
  redirectUrl:
    'com.googleusercontent.apps.544423402645-94akramas0s2v26dplmrd7ulfdirk11b:/oauth2redirect/google',
  scopes: ['https://www.googleapis.com/auth/streetviewpublish'],
};

export const handleAuthorize = () => authorize(authConfig);
