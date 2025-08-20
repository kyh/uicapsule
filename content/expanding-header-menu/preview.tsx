import React, { useState } from "react";

import { HeaderMenu } from "./source";

const Preview = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className="bg-black text-white">
      <HeaderMenu isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="no-scrollbar mt-2 flex h-[600px] flex-col gap-4 overflow-auto p-2">
        {messages.map((message) => (
          <div key={message.date} className="flex items-start gap-2">
            <div className="relative h-8 w-8 shrink-0 rounded-lg bg-white">
              <img src={message.avatar_url} alt="logo" className="rounded-lg" />
            </div>
            <div className="-mt-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">{message.name}</p>
                <p className="text-xs text-[#ABABB0]">{message.date}</p>
              </div>
              <p className="text-sm text-[#D2D3D6]">{message.message}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Preview;

interface Message {
  date: string;
  name: string;
  message: string;
  avatar_url: string;
  image_url?: string;
}

const messages: Message[] = [
  {
    date: "1:19 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
  {
    date: "2:45 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
  {
    date: "4:30 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
  {
    date: "4:32 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
  {
    date: "4:40 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
  {
    date: "4:44 PM",
    name: "Kai",
    message:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aperiam dignissimos iure nisi fugit eius aliquam, commodi iste placeat ducimus voluptatum, ut similique sunt corrupti fugiat itaque iusto, suscipit quae?",
    avatar_url:
      "https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg",
  },
];
