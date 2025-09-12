import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAttendanceExporter } from "../hooks/useAttendanceExporter";

const ExportButton = ({ class_id }) => {
  const { isExporting, exportSummary } = useAttendanceExporter();

  return (
    <TouchableOpacity
      onPress={() => exportSummary(class_id)}
      disabled={isExporting}
      className="flex-row items-center justify-center bg-[#01723a] rounded-lg p-2.5"
      style={{ opacity: isExporting ? 0.6 : 1 }}
    >
      {isExporting ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Feather name="download" size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-sm">Export</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default ExportButton;
