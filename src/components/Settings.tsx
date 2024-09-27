import { Button, InputNumber, Modal, Select } from 'antd';
import useSettings from '../hooks/useSettings';
import { themes } from '@/constants';
import { useState } from 'react';

const Settings = () => {
  const [visible, setVisible] = useState(false);
  const {
    settings,
    changeTheme,
    changePrimaryColor,
    changeDefaultQuality,
  } = useSettings();

  // ...

  return (
    <>
      <Button onClick={() => setVisible(true)}>设置</Button>
      <Modal
        title="设置"
        open={visible}
        onCancel={close}
        footer={null}
      >
        <div className="mb-4">
          <span className="mr-2">主题:</span>
          <Select
            value={settings.theme}
            options={themes as any}
            onChange={changeTheme}
          />
        </div>
        <div className="mb-4">
          <span className="mr-2">主题色:</span>
          <input
            type="color"
            value={settings.primaryColor}
            onChange={e => changePrimaryColor(e.target.value)}
          />
        </div>
        <div>
          <span className="mr-2">默认压缩质量:</span>
          <InputNumber
            min={10}
            max={100}
            value={settings.defaultQuality}
            onChange={changeDefaultQuality}
          />
        </div>
      </Modal>
    </>
  );
};

export default Settings;
