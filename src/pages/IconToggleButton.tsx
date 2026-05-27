import { useState } from 'react';
import { Button } from '@progress/kendo-react-buttons';
import { volumeUpIcon, volumeMuteIcon } from '@progress/kendo-svg-icons';

export default function IconToggleButton() {
  const [on, setOn] = useState(true);

  return (
    <div className="beghou-page">
      <Button
        togglable
        selected={on}
        onClick={() => setOn((v) => !v)}
        svgIcon={on ? volumeUpIcon : volumeMuteIcon}
        aria-label={on ? 'Sound on' : 'Sound off'}
        title={on ? 'Sound on' : 'Sound off'}
      />
    </div>
  );
}
