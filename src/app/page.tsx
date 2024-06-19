"use client";

import { useState, useRef } from "react";
import axios from "axios";


const MAX_IMAGE_SIZE = 256;

const resizeImage = (imageSrc: string, callback: (resizedImage: string) => void) => {
  const img = new Image();

  img.onload = () => {
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > MAX_IMAGE_SIZE) {
        height *= MAX_IMAGE_SIZE / width;
        width = MAX_IMAGE_SIZE;
      }
    } else {
      if (height > MAX_IMAGE_SIZE) {
        width *= MAX_IMAGE_SIZE / height;
        height = MAX_IMAGE_SIZE;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL());
    }
  };

  img.src = imageSrc;
};

type Siri = {
  image: string;
  text: string;
};

const kanaMap: { [key: string]: string } = (() => {
  const kana = [
    "あいうえお",
    "かきくけこ",
    "さしすせそ",
    "たちつてと",
    "なにぬねの",
    "はひふへほ",
    "まみむめも",
    "やゆよ",
    "らりるれろ",
    "わをん",
    "がぎぐげご",
    "ざじずぜぞ",
    "だぢづでど",
    "ばびぶべぼ",
    "ぱぴぷぺぽ",
  ].join("");
  const map: { [key: string]: string } = {};
  for (let i = 0; i < kana.length; i++) {
    map[kana[i]] = kana[i];
  }
  const slMap = {
    "ぁ": "あ",
    "ぃ": "い",
    "ぅ": "う",
    "ぇ": "え",
    "ぉ": "お",
    "ゃ": "や",
    "ゅ": "ゆ",
    "ょ": "よ",
    "っ": "つ",
  };
  return { ...map, ...slMap };
})();


export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [start, setStart] = useState<string>("あ");
  const [siris, setSiris] = useState<Siri[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        resizeImage(reader.result as string, (resizedImage) => {
          setImage(reader.result as string);
          setResizedImage(resizedImage);
          setResult("");
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const processText = (text: string) => {
    if (text == "" || text[0] !== start) {
      setResult(text);
      return;
    }
    const end = text[text.length - 1];
    if (kanaMap[end] === undefined) {
      setResult(text);
      return;
    }

    setStart(kanaMap[end]);
    setSiris(siris => [...siris, { image: image as string, text: text }]);
    setImage(null);
    setResizedImage(null);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const prompt = `これは何ですか？必ずひらがなで答えの言葉だけ返してください。\n複数の候補がある場合は、「${start}」から始まる言葉を考えてください。無い場合は他の文字から始まってもかまいません。`;
    const response = await axios.post("/api/openai", { prompt, image: resizedImage });
    const text = response.data.result;
    if (text) {
      processText(text);
    }
    if (imageInputRef?.current) {
      console.log("set value to empty")
      imageInputRef.current.value = "";
    }
  };

  return (
    <div>
      {siris.map((siri, i) => (
        <div key={i}>
          <div>
            <img src={siri.image} width="50%"/>
          </div>
          <div>
            {siri.text}
          </div>
        </div>
      ))}
      <div>
        つぎ: 「{start}」
      </div>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleImageUpload} ref={imageInputRef}/>
        <button type="submit">送信！</button>
      </form>
      {image && <img src={image} width="50%"/>}
      {result && (
        <div>{result}</div>
      )}
    </div>
  );
}
