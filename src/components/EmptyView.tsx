import { FileImageOutlined } from '@ant-design/icons';
import { FC } from 'react';

const EmptyView: FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <FileImageOutlined className="text-gray-500 text-72px" />
      <p className="text-gray-500 text-lg">将图片拖拽到此处开始压缩</p>
    </div>
  );
};

export default EmptyView;
