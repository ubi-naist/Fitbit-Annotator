function GeneralConfig(props) {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            File Backup API
          </Text>
        }
      >
        <TextInput
          title
          label="API URL"
          placeholder="Use https"
          settingsKey="apiurl"
        />
        <TextInput
          label="File Upload endpoint"
          placeholder='Without "/" prefix'
          settingsKey="fupendpoint"
        />
      </Section>
      <Section
        title={
          <Text bold align="center">
            Data Logger
          </Text>
        }
      >
        <Toggle
          label={`Log Heart Rate: ${props.settings.recordhr === "true" ? "yes" : "no"}`}
          settingsKey="recordhr"
        />
        <Toggle
          label={`Log Acceleration: ${props.settings.recordacc === "true" ? "yes" : "no"}`}
          settingsKey="recordacc"
        />
        <Toggle
          label={`Log Gyroscope: ${props.settings.recordgyro === "true" ? "yes" : "no"}`}
          settingsKey="recordgyro"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(GeneralConfig);
