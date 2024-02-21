import {authorize} from 'react-native-app-auth';
import {Image} from '../App';

const authConfig = {
  issuer: 'https://accounts.google.com',
  clientId:
    '544423402645-94akramas0s2v26dplmrd7ulfdirk11b.apps.googleusercontent.com',
  redirectUrl:
    'com.googleusercontent.apps.544423402645-94akramas0s2v26dplmrd7ulfdirk11b:/oauth2redirect/google',
  scopes: ['https://www.googleapis.com/auth/streetviewpublish'],
};

const primeMeridian = {
  N: 1,
  S: -1,
  E: 1,
  W: -1,
};

export const login = () => authorize(authConfig);

interface URLResponse {
  uploadUrl: string;
}

const handleFetch = async (url, options) => {
  const result = [null, null];
  const response = await fetch(url, options);
  const stringified = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {}
  if (!response.ok) {
    result[0] = parsed.error;
  } else {
    result[1] = parsed ?? {};
  }
  return result;
};

const getURL = async (API_KEY: string, accessToken: string) => {
  const myHeaders = new Headers();
  myHeaders.append('Authorization', `Bearer ${accessToken}`);
  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    redirect: 'follow',
  };
  try {
    const [err, data] = await handleFetch(
      `https://streetviewpublish.googleapis.com/v1/photo:startUpload?key=${API_KEY}`,
      requestOptions,
    );

    if (err) {
      throw err;
    }

    return data.uploadUrl;
  } catch (e) {
    return Promise.reject(e);
  }
};

const uploadBytes = async (accessToken: string, image: Image, url: string) => {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'image/jpeg');
  myHeaders.append('Authorization', `Bearer ${accessToken}`);

  const img_binary = await (await fetch(image.sourceURL)).arrayBuffer();

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: img_binary,
    redirect: 'follow',
  };

  try {
    const [err, data] = await handleFetch(url, requestOptions);
    if (err) {
      throw err;
    }
    return data;
  } catch (e) {
    return Promise.reject(e);
  }
};

const uploadMeta = async (
  API_KEY: string,
  accessToken: string,
  image: Image,
  url: string,
) => {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Authorization', `Bearer ${accessToken}`);

  const raw = JSON.stringify({
    uploadReference: {
      uploadUrl: url,
    },
    pose: {
      heading: image.exif['{GPS}'].ImgDirection,
      latLngPair: {
        latitude:
          image.exif['{GPS}'].Latitude *
          primeMeridian[image.exif['{GPS}'].LatitudeRef],
        longitude:
          image.exif['{GPS}'].Longitude *
          primeMeridian[image.exif['{GPS}'].LongitudeRef],
      },
    },
    captureTime: {
      seconds: image.creationDate,
    },
  });

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
  };

  try {
    const [err, data] = await handleFetch(
      `https://streetviewpublish.googleapis.com/v1/photo?key=${API_KEY}`,
      requestOptions,
    );

    if (err) {
      throw err;
    }

    return data;
  } catch (e) {
    return Promise.reject(e);
  }
};

export const publish = async (
  API_KEY: string,
  accessToken: string,
  image: Image,
) => {
  try {
    const url = (await getURL(API_KEY, accessToken)) as string;
    await uploadBytes(accessToken, image, url);
    return await uploadMeta(API_KEY, accessToken, image, url);
  } catch (e) {
    return Promise.reject(e);
  }
};
