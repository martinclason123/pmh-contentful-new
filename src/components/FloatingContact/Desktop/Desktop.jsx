"use client";
import { useState } from "react";
import styles from "./desktop.module.scss";

import ChatForm from "./ChatForm/ChatForm";

export default function Desktop() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <aside className={`${styles.desktopMessaging}`}>
      {chatOpen ? (
        <ChatForm setChatOpen={setChatOpen} />
      ) : (
        <>
          <div className={styles.dialogBox}>
            <img alt="A picture of Kara Clason" src="/assets/chat/kara.jpg" />
            <p>{`Hi there, have a question? Text with Kara here.`}</p>
            <figure></figure>
          </div>
          <button
            onClick={() => {
              setChatOpen(true);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 90.31 110.17"
              fill="white"
              width="22.9px"
              height="18.5px"
            >
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1" fill="#ffffff">
                  <polygon points="0 0 0 64.93 30.94 110.17 66.78 110.17 48.01 64.93 90.31 64.93 90.31 0 0 0"></polygon>
                </g>
              </g>
            </svg>
            <span>{`Text Kara`}</span>
          </button>
        </>
      )}
    </aside>
  );
}
