import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ChatPage } from "@/pages/ChatPage";
import { TextToSpeechPage } from "@/pages/TextToSpeechPage";
import { ImageGenerationPage } from "@/pages/ImageGenerationPage";
import { WebToolsPage } from "@/pages/WebToolsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
                  <ChatPage />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/text-to-speech" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="container mx-auto px-4 py-8">
                  <TextToSpeechPage />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/image-generation" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="container mx-auto px-4 py-8">
                  <ImageGenerationPage />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/web-tools" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="container mx-auto px-4 py-8">
                  <WebToolsPage />
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
