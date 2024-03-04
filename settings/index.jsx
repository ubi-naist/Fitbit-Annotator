import { gettext } from "i18n";

function GeneralConfig(props) {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            {gettext("api_section_title")}
          </Text>
        }
      >
        <TextInput
          title
          label={gettext("apiurl_label")}
          placeholder={gettext("apiurl_placeholder")}
          settingsKey="apiurl"
        />
        <TextInput
          label={gettext("fupendpoint_label")}
          placeholder={gettext("fupendpoint_placeholder")}
          settingsKey="fupendpoint"
        />
      </Section>
      <Section
        title={
          <Text bold align="center">
            {gettext("api_section_title")}
          </Text>
        }
      >
        <Toggle
          label={`${gettext("logger_hr")}: ${props.settings.recordhr === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="logheartrate"
        />
        <Toggle
          label={`${gettext("logger_accel")}: ${props.settings.recordacc === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="logaccelerometer"
        />
        <Toggle
          label={`${gettext("logger_gyro")}: ${props.settings.recordgyro === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="loggyroscope"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(GeneralConfig);
