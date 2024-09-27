import { useEffect, useState } from 'react';
import { ConfigProvider, theme } from 'antd';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event'

import useSettings from '@/hooks/useSettings';
import EmptyView from '@/components/EmptyView';
import ImageList from '@/components/ImageList';
import { ImageInfo } from './types';

function App() {
  const { settings } = useSettings();
  const [imageFiles, setImageFiles] = useState<ImageInfo[]>([]);

  useEffect(() => {
    let cancelFn: () => void;
    listen('tauri://file-drop', async (event) => {
      console.log('File dropped:', event);
      const imageFiles: ImageInfo[] = await invoke('read_image_files', { filePaths: event.payload as string[] })
      console.log('imageFiles:', imageFiles)
      setImageFiles(imageFiles)
    }).then(fn => cancelFn = fn);
    return () => cancelFn?.();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: settings.primaryColor,
        },
        algorithm: settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div
        className="w-full h-screen"
      >
        {imageFiles.length === 0 ? (
          <EmptyView />
        ) : (
          <ImageList files={imageFiles} />
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
