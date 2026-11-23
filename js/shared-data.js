
const ICCS_DATA = {
    prefix: "iccs_shared_",
  
    get(key, fallback = []) {
      try {
        const data = localStorage.getItem(this.prefix + key);
        return data === null ? fallback : JSON.parse(data);
      } catch (error) {
        console.error("Unable to read data:", error);
        return fallback;
      }
    },
  
    set(key, value) {
      try {
        localStorage.setItem(
          this.prefix + key,
          JSON.stringify(value)
        );
        window.dispatchEvent(
          new CustomEvent("iccs:data-changed", {
            detail: { key }
          })
        );
        return true;
      } catch (error) {
        console.error("Unable to save data:", error);
        return false;
      }
    },
  
    add(key, record) {
      const records = this.get(key);
  
      const newRecord = {
        ...record,
        id: record.id ?? (
          crypto.randomUUID?.() ||
          `${Date.now()}-${Math.random()}`
        ),
        createdAt: new Date().toISOString()
      };
  
      records.unshift(newRecord);
      this.set(key, records);
  
      return newRecord;
    },
  
    update(key, id, changes) {
      const records = this.get(key);
      const index = records.findIndex(
        item => String(item.id) === String(id)
      );
  
      if (index === -1) return false;
  
      records[index] = {
        ...records[index],
        ...changes,
        id: records[index].id
      };
  
      return this.set(key, records);
    },
  
    remove(key, id) {
      const records = this.get(key);
      return this.set(
        key,
        records.filter(
          item => String(item.id) !== String(id)
        )
      );
    }
  };
  