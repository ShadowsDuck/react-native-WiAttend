// plugins/withCustomAndroidNetwork.js
const {
  withDangerousMod,
  withAndroidManifest,
} = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// เนื้อหาของไฟล์ network_security_config.xml ที่เราต้องการ
const networkSecurityConfig = `
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.0.4</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
`;

// Plugin ที่จะเขียนไฟล์ XML ลงไปในโฟลเดอร์ของ Android ตอน Build
const withNetworkSecurityConfigFile = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const resPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res"
      );
      const xmlPath = path.join(resPath, "xml");
      const networkSecurityConfigFile = path.join(
        xmlPath,
        "network_security_config.xml"
      );

      // สร้างโฟลเดอร์ถ้ายังไม่มี
      if (!fs.existsSync(xmlPath)) {
        fs.mkdirSync(xmlPath, { recursive: true });
      }

      // เขียนไฟล์ XML
      fs.writeFileSync(networkSecurityConfigFile, networkSecurityConfig.trim());

      console.log("✅ Successfully created network_security_config.xml");
      return config;
    },
  ]);
};

// Plugin ที่จะแก้ไข AndroidManifest.xml
const withAndroidManifestConfig = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    application.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";
    console.log(
      "✅ Successfully applied android:networkSecurityConfig to AndroidManifest.xml"
    );
    return config;
  });
};

// ส่งออก Plugin ทั้งสองที่ทำงานร่วมกัน
module.exports = (config) => {
  config = withNetworkSecurityConfigFile(config);
  config = withAndroidManifestConfig(config);
  return config;
};
