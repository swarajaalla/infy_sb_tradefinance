import Layout from "../components/Layout";
import DocumentUpload from "./DocumentUpload";
import DocumentsList from "./DocumentsList";
import { useLocation } from "react-router-dom";

export default function Documents() {
  const location = useLocation();

  // Edit mode data (from DocumentsList → Edit button)
  const editMode = location.state?.editMode || false;
  const document = location.state?.document || null;

  return (
    <Layout>

      {/* ================= PAGE HEADER ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-3xl font-bold mb-2">Documents</h2>
        <p className="text-gray-600">
          Upload, edit, and manage your trade finance documents
        </p>
      </div>

      {/* ================= UPLOAD / EDIT SECTION ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-xl font-semibold mb-4">
          {editMode ? "Edit Document" : "Upload New Document"}
        </h3>

        <DocumentUpload
          editMode={editMode}
          document={document}
        />
      </div>

      {/* ================= DOCUMENTS TABLE ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">
          Uploaded Documents
        </h3>

        <DocumentsList />
      </div>

    </Layout>
  );
}
