import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function LedgerTimeline() {
  const { id } = useParams(); // document id from URL
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    api.get(`/ledger/${id}`)
      .then(res => setTimeline(res.data))
      .catch(err => console.error("Ledger fetch error", err));
  }, [id]);

  return (
    <Layout>
      <div className="bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Ledger Timeline</h2>

        {timeline.length === 0 && (
          <p className="text-gray-500">No ledger history found.</p>
        )}

        <div className="border-l-2 border-gray-300 ml-4">
          {timeline.map((item, index) => (
            <div key={index} className="ml-6 mb-6">
              <div className="bg-gray-100 p-4 rounded">
                <p className="font-semibold text-blue-700">
                  {item.action}
                </p>

                <p className="text-sm text-gray-600">
                  {item.meta_data?.note}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
