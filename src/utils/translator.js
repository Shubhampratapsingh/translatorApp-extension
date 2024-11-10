import { translateText } from "../services";
import { openNotification } from "./notification";

async function translateAPI(convertTo, text) {
  let formattedCode =
    convertTo && convertTo.includes("-") ? convertTo.split("-")[0] : convertTo;
  try {
    const res = await translateText(formattedCode, text);
    if (res) {
      return res?.trans;
    }
  } catch (error) {
    console.error("Error occured while translating");
  }
}
export const TranscriptTranslator = async (transcript, languageCode) => {
  const languagePair = {
    sourceLanguage: languageCode?.sourceLanguage,
    targetLanguage: languageCode?.targetLanguage,
  };

  const canTranslate = await window?.translation?.canTranslate(languagePair);
  let translator;
  if (canTranslate !== "no") {
    if (canTranslate === "readily") {
      // The translator can immediately be used.
      translator = await window?.translation?.createTranslator(languagePair);
    } else {
      // The translator can be used after the model download.
      translator = await window?.translation?.createTranslator(languagePair);
      translator?.addEventListener("downloadprogress", (e) => {
        // console.log(e?.loaded, e?.total);
      });
      if (translator) {
        await translator?.ready;
      } else {
        let res = await translateAPI(languageCode?.targetLanguage, transcript);
        return res;
      }
    }
  } else {
    openNotification(
      "error",
      "Error occured while translating the transcript, switching to google translate.",
      ""
    );
    let res = translateAPI(languageCode?.targetLanguage, transcript);
    return res;
  }
  if (transcript) {
    const translation = await translator?.translate(transcript);
    if (translation) {
      return translation;
    }
  }
};
