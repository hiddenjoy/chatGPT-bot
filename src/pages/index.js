import { Chat } from "@/components/Chat";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { db } from "@/firebase";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function Home() {
  /*
    메시지 목록을 저장하는 상태로, 메시지의 형태는 다음과 같음
    { role: "system" | "user" | "assistant", content: string }

    role 에 대한 상세한 내용은 다음 문서를 참고
    https://platform.openai.com/docs/guides/chat/introduction

    ex)
    [
      { role: "system", content: "너의 이름을 엘리엇이고, 나의 AI 친구야. 친절하고 명랑하게 대답해줘. 고민을 말하면 공감해줘. 반말로 대답해줘." },
      { role: "assistant", content: "안녕? 나는 엘리엇이야. 오늘은 무슨 일이 있었니?" }
      { role: "user", content: "오늘 재미난 일이 있었어! 한 번 들어볼래?" },
      ...
    ]
  */
  // const collectionRef = collection(db, "message_collection");
  // const docRef = doc(collectionRef, "message_document");

  const [messages, setMessages] = useState([]);
  // 메시지를 전송 중인지 여부를 저장하는 상태
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const collectionRef = collection(db, "message_collection");
  const docRef = doc(collectionRef, "message_document");

  useEffect(() => {
    const fetchData = async () => {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingMessages = docSnap.data().message_db;
      } else {
        let message_db = [
          {
            role: "assistant",
            content: "안녕? 나는 냥이라고 한다냥. 궁금한 게 있냥?",
          },
        ];
        await setDoc(docRef, { message_db });
      }
    };
    fetchData();
  }, []);

  // 메시지 목록을 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 메시지를 전송하는 함수
  const handleSend = async (message) => {
    const docSnap = await getDoc(docRef);
    const message_db = docSnap.data().message_db;
    // message 를 받아 메시지 목록에 추가
    // message 형태 = { role: "user", content: string }
    // ChatInput.js 26번째 줄 참고
    const updatedMessages = [...messages, message];
    // console.log("updatedMessages: ", updatedMessages);
    // console.log(updatedMessages.slice(-6));

    setMessages(updatedMessages);
    // 메시지 전송 중임을 표시
    setLoading(true);

    // /api/chat 에 메시지 목록을 전송하고 응답을 받음
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 메시지 목록의 마지막 6개만 전송
        messages: updatedMessages.slice(-6),
      }),
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    // 응답을 JSON 형태로 변환
    // 비동기 API 를 사용하여 응답을 받기 때문에 await 사용
    const result = await response.json();

    if (!result) {
      return;
    }

    // 로딩 상태를 해제하고, 메시지 목록에 응답을 추가
    setLoading(false);
    setMessages((messages) => [...messages, result]);

    message_db.push(message);
    message_db.push(result);
    console.log("Existing Messages: ", message_db);
    await updateDoc(docRef, { message_db });
  };

  // 메시지 목록을 초기화하는 함수
  // 처음 시작할 메시지를 설정
  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "안녕? 나는 냥이라고 한다냥. 궁금한 게 있냥?",
      },
    ]);
  };

  const handleGet = async () => {
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const message_db = data.message_db;
        setMessages(message_db);
      } else {
        console.log("no such document");
      }
    } catch (error) {
      console.error("failed to load data");
    }
  };

  // 메시지 목록이 업데이트 될 때마다 맨 아래로 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트가 처음 렌더링 될 때 메시지 목록을 초기화
  useEffect(() => {
    handleReset();
  }, []);

  return (
    <>
      <Head>
        <title>고양이와 대화해요ᓚᘏᗢ</title>
        <meta name="description" content="A Simple Chatbot" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex flex-col h-screen bg-zinc-700">
        <div className="flex h-[50px] sm:h-[60px] border-b border-neutral-300 py-2 px-2 sm:px-8 items-center justify-between">
          <div className="font-bold text-3xl flex justify-center items-center">
            <a className="ml-2 text-white text-center">고양이와 대화해요ᓚᘏᗢ</a>
          </div>
        </div>

        <div className="flex-1 overflow-auto sm:px-10 pb-4 sm:pb-10 bg-zinc-700 ">
          <div className="max-w-[1000px] mx-auto mt-4 sm:mt-12 flex flex-col items-center">
            {/*
              메인 채팅 컴포넌트
              messages: 메시지 목록
              loading: 메시지 전송 중인지 여부
              onSendMessage: 메시지 전송 함수
            */}
            <Chat
              messages={messages}
              loading={loading}
              onSendMessage={handleSend}
            />
            {/* 메시지 목록의 끝으로 스크롤하기 위해 참조하는 엘리먼트 */}
            <div ref={messagesEndRef} />
            <button
              onClick={handleGet}
              className="flex bg-pink-500 hover:bg-pink-700 text-white font-bold py-2 px-4 border border-pink-500 rounded mt-10"
            >
              이전 대화기록 확인하기
            </button>
          </div>
        </div>
        <div className="flex h-[30px] sm:h-[50px] border-t border-neutral-300 py-2 px-8 items-center sm:justify-between justify-center"></div>
      </div>
    </>
  );
}
