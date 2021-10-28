import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import useSound from "use-sound";
import config from "../../../config";
import LatestMessagesContext from "../../../contexts/LatestMessages/LatestMessages";
import TypingMessage from "./TypingMessage";
import Header from "./Header";
import Footer from "./Footer";
import Message from "./Message";
import "../styles/_messages.scss";
import initialBottyMessage from "../../../common/constants/initialBottyMessage";

const socket = io(config.BOT_SERVER_ENDPOINT, {
  transports: ["websocket", "polling", "flashsocket"],
});

function Messages() {
  const containerRef = useRef(null);
  //const chatEndRef = useRef(null);
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([{ message: initialBottyMessage }]);
  const [isTyping, setIsTyping] = useState(false);

  const onChangeMessage = useCallback((e) => {
    setMessage(e.target.value);
  }, []);

  const sendMessage = useCallback(() => {
    setMessage("");
    setChat([...chat, { user: "me", message }]);
    playSend();
    socket.emit("user-message", message);
  }, [message]);

  const incomingBottyReply = useCallback(
    (newMessage) => {
      setIsTyping(false);
      setChat([...chat, { user: "bot", message: newMessage }]);
      setLatestMessage("bot", newMessage);
      playReceive();
    },
    [chat]
  );

  useEffect(() => {
    socket.on("bot-typing", () => setIsTyping(true));
  }, []);

  useEffect(() => {
    socket.on("bot-message", incomingBottyReply);
    const element = containerRef.current;
    element.scrollIntoView({
      top: element.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  }, [incomingBottyReply, chat, isTyping]);

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {chat.map((message) => (
          <Message message={message} />
        ))}
        {isTyping && <TypingMessage />}
        <div ref={containerRef} />
      </div>
      <Footer
        message={message}
        sendMessage={sendMessage}
        onChangeMessage={onChangeMessage}
      />
    </div>
  );
}

export default Messages;
