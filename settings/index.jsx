function GeneralConfig(props) {
    return (
        <Page>
            <Section>
                title={<Text bold align="center">Fitbit Annotator Settings</Text>}
                <TextInput
                    label="API URL"
                    placeholder="Use https"
                    settingsKey="apiurl"
                >https://testapi.local</TextInput>
                <TextInput
                    label="File Upload endpoint"
                    placeholder='Without "/" prefix'
                    settingsKey="fupendpoint"
                >fileserver.php</TextInput>
            </Section>
        </Page>
    );
}

registerSettingsPage(GeneralConfig);