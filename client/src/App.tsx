import { Toaster } from 'react-hot-toast';
import NotificationSettings from './NotificationSettings';
import Section from './Section';
import './styles.css';

export default function App() {
  return (
    <>
      <Section collapsible header="Notifications">
        <NotificationSettings />
      </Section>

      <Toaster />
    </>
  );
}
