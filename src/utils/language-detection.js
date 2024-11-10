import { openNotification } from "./notification";

const getPrimaryLanguage = () => {
  const userLang = window.navigator.userLanguage || window.navigator.language;
  return userLang && userLang.includes("-") ? userLang.split("-")[0] : userLang;
};

export const LanguageDetector = async (userText) => {
  const canDetect = await window?.translation?.canDetect();
  let detector;
  if (canDetect !== "no") {
    if (canDetect === "readily") {
      // The language detector can immediately be used.
      detector = await window?.translation?.createDetector();
    } else {
      // The language detector can be used after the model download.
      detector = await window?.translation?.createDetector();
      detector?.addEventListener("downloadprogress", (e) => {});
      if (detector) {
        await detector?.ready;
      } else {
        openNotification(
          "error",
          "Unable to detect user Language, switching to browser language.",
          ""
        );
        const detectedLanguage = getPrimaryLanguage();
        return {
          detectedLanguage: detectedLanguage,
        };
      }
    }
  } else {
    // The language detector can't be used at all.
    openNotification(
      "error",
      "Unable to detect user Language, switching to browser language.",
      ""
    );
    const detectedLanguage = getPrimaryLanguage();
    return {
      detectedLanguage: detectedLanguage,
    };
  }

  const results = await detector?.detect(userText);
  if (results?.length > 0) {
    const highestConfidence = results?.reduce((max, obj) => {
      return obj?.confidence > max?.confidence ? obj : max;
    });
    return highestConfidence;
  }
};
