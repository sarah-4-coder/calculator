/* eslint-disable */
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/constants";
import { ColorSwatch, Group } from "@mantine/core";
import axios from "axios";

interface GeneratedResult {
  expression: string;
  answer: string;
}


export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [dictOfVars] = useState({});
  const [result, setResult] = useState<GeneratedResult>();
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultTimeout = useRef<NodeJS.Timeout | null>(null);

  

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - canvas.offsetTop;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (loading) return; //this will prevent multiple requests at the same time :-Throttle optimization
      setLoading(true);
      try {
        const response = await axios<any>({
          method: "post",
          url: `${import.meta.env.VITE_API_URL}/calculate`,
          data: {
            image: canvas.toDataURL("image/jpeg", 0.7), //reducing the quality to 70% for better performance
            dict_of_vars: dictOfVars,
          },
        });

        const res = response.data;
        console.log("Full Response:", res);

        if (
          res.status === "success" &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          const firstResult = res.data[0];
          setResult({
            expression: firstResult.expr,
            answer: firstResult.result,
          });
          setShowResult(true);

          if (resultTimeout.current) clearTimeout(resultTimeout.current);
          resultTimeout.current = setTimeout(() => {
            setShowResult(false);
          }, 5000);
        }
      } catch (error) {
        console.error("Error sending data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
        setShowResult(false);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  return (
    <>
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 bg-white/90 p-3 rounded shadow">
        <Button
          className="bg-black text-white"
          onClick={() => {
            setReset(true);
          }}
        >
          Reset
        </Button>
        <Group>
          {SWATCHES.map((scolor: string) => {
            return (
              <ColorSwatch
                key={scolor}
                color={scolor}
                onClick={() => {
                  setColor(scolor);
                }}
              />
            );
          })}
        </Group>
        <Button className="bg-black text-white" onClick={sendData}>
          Calculate
        </Button>
      </div>

      {showResult && result && !loading && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white p-6 rounded-xl shadow-xl z-30 w-full max-w-md transition-opacity duration-300">
          <h2 className="text-xl font-semibold mb-2">🧾 Result</h2>
          <div>
            <strong>Expression:</strong> {result.expression}
          </div>
          <div>
            <strong>Answer:</strong> {result.answer}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-lg shadow-md z-50">
          Calculating...
        </div>
      )}

      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </>
  );
}
