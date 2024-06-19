"use client";

import { useState, useRef, useEffect } from "react";
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
  const map: { [key: string]: string } = kana.split("").reduce((acc, c) => ({ ...acc, [c]: c }), {});
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


const hyphenMap: { [key: string]: string } = {
  ..."あかさたなはまやらわがざだばぱぁゃ".split("").reduce((acc, c) => ({ ...acc, [c]: "あ" }), {}),
  ..."いきしちにひみりぎじぢびぴぃ".split("").reduce((acc, c) => ({ ...acc, [c]: "い" }), {}),
  ..."うくすつぬふむゆるぐずづぶぷぅゅ".split("").reduce((acc, c) => ({ ...acc, [c]: "う" }), {}),
  ..."えけせてねへめれげぜでべぺぇ".split("").reduce((acc, c) => ({ ...acc, [c]: "え" }), {}),
  ..."おこそとのほもよろをごぞどぼぽぉょ".split("").reduce((acc, c) => ({ ...acc, [c]: "お" }), {}),
};


function getNext(text: string): string | null {
  if (text == "") {
    return null;
  }
  if (kanaMap[text[text.length - 1]] !== undefined) {
    return kanaMap[text[text.length - 1]];
  }
  if (text.length > 1 && text[text.length - 1] === "ー") {
    if (hyphenMap[text[text.length - 2]] !== undefined) {
      return hyphenMap[text[text.length - 2]];
    }
  }
  return null;
}


export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [siris, setSiris] = useState<Siri[]>([]);

  // Initialize start
  useEffect(() => {
    setStart(Object.values(kanaMap)[Math.floor(Math.random() * Object.keys(kanaMap).length)]);
  }, []);

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
    const next = getNext(text);
    if (next === null) {
      setResult(text);
      return;
    }

    setStart(next);
    setSiris(siris => [...siris, { image: image as string, text: text }]);
    setImage(null);
    setResizedImage(null);
    setResult("");
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const prompt = `これは何ですか？必ずひらがなで答えの言葉だけ返してください。\n句読点や記号は不要です。\n複数の候補がある場合は、「${start}」から始まる言葉を考えてください。無い場合は他の文字から始まってもかまいません。\n例: とろふぃー りんご じゃーじ`;
    const response = await axios.post("/api/openai", { prompt, image: resizedImage });
    const text = response.data.result;
    if (text) {
      processText(text);
    }
    if (imageInputRef?.current) {
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
        <input type="file" accept="image/*" onChange={handleImageUpload} ref={imageInputRef}/>
        <button type="submit">送信！</button>
      </form>
      {image && <img src={image} width="50%"/>}
      {result && (
        <div>{result}</div>
      )}
    </div>
  );
}
