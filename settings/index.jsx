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
          label={`${gettext("logger_hr")}: ${props.settings.logheartrate === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="logheartrate"
        />
        <Toggle
          label={`${gettext("logger_accel")}: ${props.settings.logaccelerometer === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="logaccelerometer"
        />
        <Toggle
          label={`${gettext("logger_gyro")}: ${props.settings.loggyroscope === "true" ? gettext("yes") : gettext("no")}`}
          settingsKey="loggyroscope"
        />
      </Section>
    </Page>
  );
}

registerSettingsPage(GeneralConfig);
