import { CheckinForm } from "@/features/checkins/components/CheckinForm";
import { LocationAtQuery } from "@/features/checkins/components/LocationAtQuery";

export default function Page() {
  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dimagi - Whereis</h1>
        </div>
      </div>

      <div className="stack-gap-md" />

      <CheckinForm />

      <div className="stack-gap-md" />

      <LocationAtQuery />
    </div>
  );
}
