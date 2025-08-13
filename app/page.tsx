"use client";

import { useEffect, useRef, useState } from "react";
import { RenderingEngine, Enums, type Types } from "@cornerstonejs/core";
import { init as csRenderInit } from "@cornerstonejs/core";
import { init as csToolsInit } from "@cornerstonejs/tools";
import { init as dicomImageLoaderInit } from "@cornerstonejs/dicom-image-loader";

function App() {
  const elementRef = useRef<HTMLDivElement>(null);
  const running = useRef(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const setup = async () => {
      if (running.current) {
        return;
      }
      running.current = true;

      await csRenderInit();
      await csToolsInit();
      dicomImageLoaderInit({ maxWebWorkers: 1 });

      setIsInitialized(true);
    };

    setup();
  }, []);

  const loadDicomFile = async (file: File) => {
    if (!isInitialized || !elementRef.current) return;

    try {
      // Create a URL for the file
      const fileUrl = URL.createObjectURL(file);

      // Create imageId for the local file
      const imageId = `wadouri:${fileUrl}`;

      // Instantiate a rendering engine
      const renderingEngineId = "myRenderingEngine";
      const renderingEngine = new RenderingEngine(renderingEngineId);
      const viewportId = "CT";

      const viewportInput = {
        viewportId,
        type: Enums.ViewportType.STACK,
        element: elementRef.current,
        defaultOptions: {
          orientation: Enums.OrientationAxis.AXIAL,
        },
      };

      renderingEngine.enableElement(viewportInput);

      // Get the stack viewport that was created
      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      // Set the image on the viewport
      await viewport.setStack([imageId]);

      // Render the image
      viewport.render();

      // Clean up the object URL when done
      setTimeout(() => {
        URL.revokeObjectURL(fileUrl);
      }, 1000);
    } catch (error) {
      console.error("Error loading DICOM file:", error);
      alert("DICOM 파일을 로드하는 중 오류가 발생했습니다.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      loadDicomFile(file);
    }
  };

  const loadSampleFile = () => {
    // File input을 통해 파일을 선택한 것처럼 처리
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".dcm";
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        setSelectedFile(file);
        loadDicomFile(file);
      }
    };
    input.click();
  };

  return (
    <div className="p-4">
      <div className="mb-4 space-y-2">
        <h1 className="text-2xl font-bold">DICOM 뷰어</h1>
        <div className="flex space-x-2">
          <input
            type="file"
            accept=".dcm"
            onChange={handleFileChange}
            className="border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={loadSampleFile}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            샘플 파일 로드
          </button>
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-600">
            선택된 파일: {selectedFile.name}
          </p>
        )}
      </div>

      <div
        ref={elementRef}
        style={{
          width: "512px",
          height: "512px",
          backgroundColor: "#000",
          border: "1px solid #ccc",
        }}
      ></div>

      {!isInitialized && (
        <div className="mt-4 text-center text-gray-600">초기화 중...</div>
      )}
    </div>
  );
}

export default App;
