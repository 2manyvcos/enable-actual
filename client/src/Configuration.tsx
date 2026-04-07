import NotificationSettings from './NotificationSettings';
import Section from './Section';

export default function Configuration() {
  return (
    <>
      <Section collapsible header="Notification Settings">
        <NotificationSettings />
      </Section>
    </>
  );
}
