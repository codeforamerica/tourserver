class AddAttachmentItemToMediaItems < ActiveRecord::Migration
  def self.up
    change_table :media_items do |t|
      t.attachment :item
    end
  end

  def self.down
    drop_attached_file :media_items, :item
  end
end
