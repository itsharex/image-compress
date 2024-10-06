import { themes } from '@/constants'
import type { GlobalSettings } from '@/types'
import { SettingOutlined } from '@ant-design/icons'
import { ColorPicker, Form, InputNumber, Modal, Radio } from 'antd'
import { useState } from 'react'
import useSettings from '../hooks/useSettings'

const Settings = () => {
  const [visible, setVisible] = useState(false)
  const { settings, changeTheme, changePrimaryColor, changeDefaultQuality } = useSettings()

  return (
    <>
      <div className="flex items-center cursor-pointer text-main" onClick={() => setVisible(true)}>
        <SettingOutlined />
        <span className="ml-2">系统设置</span>
      </div>
      <Modal title="系统设置" open={visible} width={400} onCancel={() => setVisible(false)} footer={null}>
        <Form<GlobalSettings>
          layout="horizontal"
          initialValues={settings}
          labelCol={{ span: 7 }}
          // onFinish={(values) => {
          //   changeSettings(values);
          //   setVisible(false);
          // }}
        >
          <Form.Item name="theme" label="主题">
            {/* <Select options={themes as any} /> */}
            <Radio.Group
              onChange={e => {
                changeTheme(e.target.value)
              }}
            >
              {themes.map(theme => (
                <Radio key={theme.value} value={theme.value}>
                  {theme.label}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="primaryColor" label="主题色">
            <ColorPicker
              showText
              onChange={color => {
                changePrimaryColor(color.toHexString())
              }}
            />
          </Form.Item>
          <Form.Item name="defaultQuality" label="默认压缩质量">
            <InputNumber
              min={10}
              max={100}
              suffix="%"
              onChange={value => {
                changeDefaultQuality(value)
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Settings
