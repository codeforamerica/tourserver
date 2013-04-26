class AddAttachmentCoverImageToTours < ActiveRecord::Migration
  def self.up
    change_table :tours do |t|
      t.attachment :cover_image
    end
  end

  def self.down
    drop_attached_file :tours, :cover_image
  end
end
