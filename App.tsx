
import React, { useState, useCallback, useRef } from 'react';
import { TopicInput } from './components/TopicInput';
import { WorkflowDisplay } from './components/WorkflowDisplay';
import * as geminiService from './services/geminiService';
import { Log, LogStatus, GeneratedAsset, AssetType } from './types';
import { decode } from './utils/audioUtils';
import { addTextToImage } from './utils/imageUtils';

// NOTE: The user requested 50 titles, 18 image prompts, and 2 images per prompt.
// For browser performance, API rate limits, and cost, these are reduced.
// This can be configured in `services/geminiService.ts`.

export default function App() {
  const [topic, setTopic] = useState<string>('');
  const [previousTopics, setPreviousTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  
  const logCounter = useRef(0);

  const addLog = useCallback((status: LogStatus, message: string) => {
    setLogs(prev => [...prev, { id: logCounter.current++, status, message }]);
  }, []);
  
  const addAsset = useCallback((type: AssetType, name: string, blob: Blob) => {
    const asset: GeneratedAsset = {
        id: `${name}-${Date.now()}`,
        type,
        name,
        blob,
        url: URL.createObjectURL(blob),
    };
    setGeneratedAssets(prev => [asset, ...prev]);
  }, []);

  const handleStartWorkflow = async () => {
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setProgress(0);
    setLogs([]);
    setGeneratedAssets([]);
    logCounter.current = 0;
    
    setPreviousTopics(prev => [...prev, topic.trim()]);
    
    let totalSteps = 0;
    const sanitizedTopic = topic.trim().replace(/\s+/g, '_');

    try {
        addLog(LogStatus.INFO, `Starting content generation for topic: "${topic}"`);

        // Step 1: Generate Titles
        addLog(LogStatus.PENDING, 'Generating unique YouTube titles...');
        const titles = await geminiService.generateTitles(topic);
        if (titles.length === 0) throw new Error("Failed to generate titles.");
        addLog(LogStatus.SUCCESS, `Generated ${titles.length} titles.`);
        const titlesBlob = new Blob([titles.join('\n')], { type: 'text/plain' });
        addAsset(AssetType.TITLE_LIST, `${sanitizedTopic}_titles.txt`, titlesBlob);
        
        // Calculate total steps for progress bar: titles (1) + 4 steps per title (script, audio, image, thumbnail)
        totalSteps = 1 + (titles.length * 4);
        let completedSteps = 1;
        setProgress(completedSteps / totalSteps * 100);

        for (let i = 0; i < titles.length; i++) {
            const currentTitle = titles[i];
            const titleNumber = i + 1;
            const assetNamePrefix = `${sanitizedTopic}_${titleNumber}_${currentTitle.substring(0,20).replace(/\s+/g, '_')}`;

            // Step 2: Generate Script
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating script for: "${currentTitle}"`);
            const script = await geminiService.generateScript(currentTitle);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Script generated.`);
            addAsset(AssetType.SCRIPT, `${assetNamePrefix}_script.txt`, new Blob([script], { type: 'text/plain' }));
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);
            
            // Step 3: Generate Audio
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating voiceover...`);
            const audioBlob = await geminiService.generateAudio(script);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Voiceover generated.`);
            addAsset(AssetType.AUDIO, `${assetNamePrefix}_audio.mp3`, audioBlob);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);

            // Step 4: Generate Thumbnail Image
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating thumbnail prompt...`);
            const thumbnailPrompt = await geminiService.generateThumbnailPrompt(currentTitle);
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Generating image for: "${thumbnailPrompt.substring(0, 40)}..."`);
            const imagesBase64 = await geminiService.generateImages(thumbnailPrompt);
            const imageBase64 = imagesBase64[0];
            if (!imageBase64) throw new Error("Failed to generate image.");
            
            const imageBlob = new Blob([decode(imageBase64)], { type: 'image/jpeg' });
            addAsset(AssetType.IMAGE, `${assetNamePrefix}_image.jpg`, imageBlob);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Base image generated.`);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);

            // Step 5: Create Thumbnail (Add Text to Image)
            addLog(LogStatus.PENDING, `[${titleNumber}/${titles.length}] Creating final thumbnail...`);
            const thumbnailBlob = await addTextToImage(imageBlob, currentTitle);
            addAsset(AssetType.THUMBNAIL, `${assetNamePrefix}_thumbnail.jpg`, thumbnailBlob);
            addLog(LogStatus.SUCCESS, `[${titleNumber}/${titles.length}] Thumbnail created successfully.`);
            completedSteps++;
            setProgress(completedSteps / totalSteps * 100);
        }
        
        addLog(LogStatus.SUCCESS, "Workflow completed successfully!");
        setProgress(100);

    } catch (error) {
        console.error("Workflow failed:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        addLog(LogStatus.ERROR, `Workflow failed: ${errorMessage}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            AI YouTube Content Factory
          </h1>
          <p className="mt-2 text-lg text-slate-400">
            Automate your content pipeline from a single topic.
          </p>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <TopicInput 
              topic={topic}
              setTopic={setTopic}
              onStart={handleStartWorkflow}
              isLoading={isLoading}
              previousTopics={previousTopics}
            />
          </div>
          <div className="lg:col-span-2 min-h-[600px]">
            <WorkflowDisplay
              logs={logs}
              assets={generatedAssets}
              progress={progress}
              isLoading={isLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
