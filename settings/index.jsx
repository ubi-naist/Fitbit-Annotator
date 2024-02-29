function GeneralConfig(props) {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Fitbit Annotator Settings
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
    </Page>
  );
}

registerSettingsPage(GeneralConfig);
