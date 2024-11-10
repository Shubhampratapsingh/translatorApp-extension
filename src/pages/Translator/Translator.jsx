import io from "socket.io-client";
import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { LanguageDetector } from "../../utils/language-detection";
import { TranscriptTranslator } from "../../utils/translator";
import { TextSummarizer } from "../../utils/summarizer";
import { API_URL } from "../../constants/api-constants";
import { saveTranscript } from "../../services";
import { useAuth, SignedIn } from "@clerk/chrome-extension";
import { openNotification } from "../../utils/notification";

const socket = io.connect(API_URL);

function Translator() {
  // Room State
  const [room, setRoom] = useState("");
  const [isActiveRoom, setIsActiveRoom] = useState(false);

  // Messages State
  const [messageReceived, setMessageReceived] = useState("");
  const [translatedReceivedMessage, setTranslatedReceivedMessage] =
    useState("");

  const [summaryText, setSummaryText] = useState("");
  // Speech recognition setup
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);

  const { getToken } = useAuth();

  // useEffect to handle incoming messages
  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageReceived(data?.message);
    });

    // Clean up on unmount
    return () => {
      socket.off("receive_message");
    };
  }, []);

  // Emit transcript in real-time
  useEffect(() => {
    if (isActiveRoom && transcript.trim() !== "") {
      socket.emit("send_message", { message: transcript, room });
    }
  }, [transcript, isActiveRoom, room]);

  const joinRoom = () => {
    if (room !== "") {
      socket.emit("join_room", room);
      setIsActiveRoom(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leave_room", room);
    setIsActiveRoom(false);
    setMessageReceived("");
    setRoom("");
    setTranslatedReceivedMessage("");
    SpeechRecognition.stopListening();
    resetTranscript();
  };

  const handleStartListening = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log("Microphone access granted", stream);
        SpeechRecognition.startListening({
          continuous: true,
        });
        setIsListening(true);
      })
      .catch((err) => {
        console.error("Failed to access microphone:", err);
      });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };

  if (!browserSupportsSpeechRecognition) {
    return <p>Speech recognition is not supported in this browser.</p>;
  }

  const translateTranscript = () => {
    if (transcript) {
      LanguageDetector(transcript)
        .then((myDetectedLanguage) => {
          if (!myDetectedLanguage) {
            return;
          }

          const myLangCode = myDetectedLanguage?.detectedLanguage;

          if (messageReceived) {
            LanguageDetector(messageReceived)
              .then((otherDetectedLanguage) => {
                if (!otherDetectedLanguage) {
                  return;
                }

                const otherLangCode = otherDetectedLanguage?.detectedLanguage;

                if (
                  messageReceived.trim() !== "" &&
                  otherLangCode &&
                  myLangCode
                ) {
                  const transcriptLanguage = {
                    sourceLanguage: otherLangCode,
                    targetLanguage: myLangCode,
                  };

                  TranscriptTranslator(messageReceived, transcriptLanguage)
                    .then((translated) => {
                      // console.log("Translated text:", translated);
                      if (translated) {
                        setTranslatedReceivedMessage(translated);
                      }
                    })
                    .catch((error) => {
                      console.error("Error translating language:", error);
                    });
                }
              })
              .catch((error) => {
                console.error("Error detecting language:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Error detecting language:", error);
        });
    }
  };

  const summarizeMeeting = () => {
    const finalText = transcript + messageReceived;
    const summary = TextSummarizer(finalText);
    setSummaryText(summary);
  };

  const saveDetails = async () => {
    try {
      const token = await getToken();
      const payload = {
        user1_transcript: transcript,
        user2_transcript: messageReceived,
        summary: summaryText,
      };
      const res = await saveTranscript(payload, token);
      if (res) {
        openNotification("success", "Saved successfully", "");
      }
    } catch (error) {
      openNotification("error", "Error occurred while saving transcripts.", "");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speech to text section */}
        <div className="p-6 bg-white rounded-lg shadow-lg">
          {!isActiveRoom ? (
            <div className="flex flex-col mb-6">
              <input
                type="text"
                placeholder="Enter Room Number..."
                className="p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(event) => setRoom(event.target.value)}
              />
              <button
                onClick={joinRoom}
                className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
              >
                Create/Join Room
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold">{`Room: ${room}`}</h1>
              <button
                onClick={leaveRoom}
                className="bg-red-500 text-white py-1 px-4 rounded hover:bg-red-600 transition"
              >
                Leave Room
              </button>
            </div>
          )}

          <div className="flex flex-col mb-4">
            <div className="main-content p-3 border border-gray-300 rounded bg-gray-50">
              <p>{transcript || "Start speaking to see text..."}</p>
            </div>
          </div>

          <div className="flex space-x-4 mb-6">
            {isListening ? (
              <button
                onClick={handleStopListening}
                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition"
              >
                Stop Listening
              </button>
            ) : (
              <button
                onClick={handleStartListening}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
              >
                Start Listening
              </button>
            )}
          </div>

          <h2 className="text-lg font-semibold">Transcript from other user:</h2>
          <div className="p-3 border border-gray-200 rounded bg-gray-100 mt-2 text-gray-700">
            {messageReceived || "No transcript received yet."}
          </div>
        </div>

        {/* Translated transcript section */}
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold">Translated Transcript:</h2>
            {messageReceived?.length > 0 && (
              <button
                onClick={translateTranscript}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
              >
                Translate
              </button>
            )}
          </div>
          <p className="text-gray-700 mb-4">
            {translatedReceivedMessage ||
              "Translated transcripts are not available."}
          </p>
        </div>
      </div>
      <SignedIn>
        <div className="summary my-6">
          {summaryText.length > 0 ? (
            <p>{summaryText}</p>
          ) : (
            <h1>Summary not available.</h1>
          )}
        </div>
        <div className="footer-buttons mt-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={summarizeMeeting}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              Summarize
            </button>

            <button
              onClick={saveDetails}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              Save
            </button>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}

export default Translator;
