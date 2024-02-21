import React, {useEffect} from 'react';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

const __DEV__ = false;

export const initialAdsCheck = async () => {
  const result = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
  if (result === RESULTS.DENIED) {
    // The permission has not been requested, so request it.
    await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);
  }
  try {
    return await mobileAds().initialize();
  } catch (e) {
    return e;
  }
};

const adUnitIdInterstitial = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-6632907169661571/5733236428';

// const adUnitRewarded = __DEV__
//   ? TestIds.REWARDED
//   : 'ca-app-pub-xxxxxxxxxxxxx/yyyyyyyyyyyyyy';

export const interstitial = InterstitialAd.createForAdRequest(
  adUnitIdInterstitial,
  {
    keywords: ['outdoors', 'clothing'],
  },
);

// export const rewarded = RewardedAd.createForAdRequest(adUnitRewarded, {
//   keywords: ['outdoors', 'clothing'],
// });

export const subscribeInterstitial = setter => {
  const loaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
    setter(true);
  });
  const closed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    setter(false);
  });
  return [loaded, closed];
};

// export const subscribeRewarded = setter => {
//   const loaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
//     setter(true);
//   });
//   const closed = rewarded.addAdEventListener(
//     RewardedAdEventType.EARNED_REWARD,
//     () => {
//       setter(false);
//     },
//   );
//   return [loaded, closed];
// };

/**
 * component that only shows an add once when rendered
 * Designed to be rendered when the add is loaded
 */
export const ShowAdd = props => {
  const {show} = props;
  useEffect(() => {
    setTimeout(() => {
      show();
    }, 2500);
  }, []);
  return <></>;
};

export const showRandom = array => {
  return array[Math.floor(Math.random() * array.length)];
};
