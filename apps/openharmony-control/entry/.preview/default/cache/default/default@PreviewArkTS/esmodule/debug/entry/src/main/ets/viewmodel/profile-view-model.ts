import { createProfileViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/page-view-state";
import type { ProfileViewState } from "@bundle:com.example.smarthomecontrol/entry/ets/model/page-view-state";
export class ProfileViewModel {
    load(): ProfileViewState {
        return createProfileViewState();
    }
}
